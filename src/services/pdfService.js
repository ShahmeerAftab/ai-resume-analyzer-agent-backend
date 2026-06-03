import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = ""; // no worker thread needed in Node.js

// accepts req.file.buffer and returns all text from the PDF as a string
const extractTextFromPDF = async (buffer) => {
  const uint8Array = new Uint8Array(buffer); // PDF.js needs Uint8Array, not Node Buffer

  const loadingTask = pdfjsLib.getDocument({ data: uint8Array, verbosity: 0 });
  const pdfDocument = await loadingTask.promise;

  // loop pages (PDF.js pages start at 1, not 0)
  const pageTexts = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
    const page        = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText    = textContent.items.map((item) => item.str).join(" ");
    pageTexts.push(pageText);
  }

  await pdfDocument.destroy(); // free memory

  const cleanText = pageTexts
    .join("\n")
    .replace(/\r\n/g, "\n")     // Windows → Unix line endings
    .replace(/[ \t]+/g, " ")    // collapse extra spaces
    .replace(/\n{3,}/g, "\n\n") // max 2 blank lines
    .trim();

  if (!cleanText) throw new Error("PDF appears to be empty or image-only");

  return cleanText;
};

export default extractTextFromPDF;
