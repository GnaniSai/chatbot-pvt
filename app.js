const { GoogleGenAI } = require("@google/genai");
const { marked } = require("marked");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
require("dotenv").config();

const express = require("express");

const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const ai = new GoogleGenAI({ apiKey: process.env.MY_API_KEY });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

app.post("/chat", async (req, res) => {
  const {userPrompt} = req.body
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
    });
    let result = marked(response.text);
    return res.status(200).send({ message: result }).json();
  } catch (error) {
    console.log("Error:", error);
  }
});

let i = 1;

const getPDFBuffer = (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(12);
    doc.text(data, {
      align: "center",
      lineGap: 5,
    });

    doc.end();
  });
};



app.post("/chat/proposal", async (req, res) => {
  let { userPrompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
      config: {
        systemInstruction:
          "Generate a structured business proposal based on the provided inputs, including Business Name, Industry, Problem Statement, Solution, Target Market, Unique Value Proposition, Revenue Model, Operational Plan, Marketing Strategy, Financial Projections, and Funding Requirements. The output should be formal, concise, and directly present the business details without any introductions, summaries, or conclusions.",
      },
    });
    let result = marked(response.text);
    return res.status(200).send({ message: result }).json();
  } catch (error) {
    console.log("Error:", error);
  }
});

app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "proposals", filename);
  res.download(filePath);
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MY_GMAIL_ADDRESS,
    pass: process.env.MY_GMAIL_PASSWORD
  },
});

async function sendMail(to, pdfBuffer) {
  const info = await transporter.sendMail({
    to: to,
    subject: 'Your Proposal',
    text: 'Here is your proposal PDF!',
    attachments: [
      {
        filename: 'proposal.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
  console.log("Email sent: %s", info.response);
}





app.post("/send-email", async (req, res) => {
  const { email, proposalText } = req.body;
  try {
    const pdfBuffer = await getPDFBuffer(proposalText);
    await sendMail(email, pdfBuffer);
    res.send({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send({ message: "Error sending email" });
  }
});



module.exports = app;
