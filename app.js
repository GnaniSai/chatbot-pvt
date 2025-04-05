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
  let { userPrompt } = req.body;
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

function saveFile(data) {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, "proposals", `proposal${i}.pdf`);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  doc.fontSize(12);
  doc.text(data, {
    align: "left",
    lineGap: 5,
  });

  doc.end();

  writeStream.on("finish", () => {
    console.log("PDF Created");
  });
  i++;
}

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
    saveFile(response.text);
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
    user: "nithingodeshi33@gmail.com",
    pass: "vgho aqff emht nnjm",
  },
});

async function sendMail(to, filename) {
  const filePath = path.join(__dirname, "proposals", filename);
  const info = await transporter.sendMail({
    from: "nithingodeshi33@gmail.com",
    to: to,
    subject: "Halo ai business proposal",
    text: "Hello world?",

    attachments: [
      {
        path: filePath,
      },
    ],
  });

  console.log("Email sent: %s", info.response);
}

app.post("/send-email", async (req, res) => {
  const { email, filename } = req.body;
  try {
    await sendMail(email, filename);
    res.send({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.send({ message: "Error sending email" });
  }
});

module.exports = app;
