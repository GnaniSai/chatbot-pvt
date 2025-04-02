const { GoogleGenAI } = require("@google/genai");
const { marked } = require("marked");
const fs = require("fs");
const PDFDocument = require("pdfkit");
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

app.post("/chat", async (req, res) => {
  let { userPrompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro-exp-03-25",
      contents: userPrompt,
    });
    let result = marked(response.text);
    return res.status(200).send({ message: result }).json();
  } catch (error) {
    console.log("Error:", error);
  }
});

let i = 1
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
    i++;
  });
}

app.post("/chat/proposal", async (req, res) => {
  let { userPrompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro-exp-03-25",
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


module.exports = app;
