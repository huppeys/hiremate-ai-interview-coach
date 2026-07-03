const pdfParse = require("pdf-parse");

async function extractResumeText(fileBuffer) {
  if (!fileBuffer || fileBuffer.length === 0) return "";

  try {
    const data = await pdfParse(fileBuffer);
    return data.text || "";
  } catch (err) {
    console.error("PDF parse error:", err.message);
    return "";
  }
}

module.exports = { extractResumeText };
