// imported from lib/ directly — the package's main file has a debug block
// that breaks when loaded as an ES module
import pdfParse from "pdf-parse/lib/pdf-parse.js";

// accepts req.file.buffer and returns all text from the PDF as a string
const extractTextFromPDF = async (buffer) => {
  const data = await pdfParse(buffer);

  const cleanText = data.text
    .replace(/\r\n/g, "\n")     // Windows → Unix line endings
    .replace(/[ \t]+/g, " ")    // collapse extra spaces
    .replace(/\n{3,}/g, "\n\n") // max 2 blank lines
    .trim();

  if (!cleanText) throw new Error("PDF appears to be empty or image-only");

  return cleanText;
};

export default extractTextFromPDF;
