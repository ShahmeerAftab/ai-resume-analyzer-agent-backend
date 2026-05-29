import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

const extractTextFromPDF = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer, verbosity: 0 });
  const result = await parser.getText();
  await parser.destroy();

  const cleanText = result.text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleanText) throw new Error("PDF appears to be empty or image-only");

  return cleanText;
};

export default extractTextFromPDF;
