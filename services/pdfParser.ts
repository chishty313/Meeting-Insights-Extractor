import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from "pdfjs-dist";

// Configure pdf.js worker for Vite/ESM
// Use the ESM worker path; Vite will resolve it and bundle correctly
// See: https://github.com/mozilla/pdf.js/
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Extract plain text from a PDF File in the browser using pdfjs-dist
 */
export async function parsePdfFile(file: File): Promise<string> {
  // Read file as ArrayBuffer to avoid cross-origin issues with object URLs
  const data = await file.arrayBuffer();

  const loadingTask = getDocument({ data });
  const pdf: PDFDocumentProxy = await loadingTask.promise;

  const pagesText: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => item?.str ?? "")
      .filter(Boolean);
    const pageText = strings.join(" ");
    pagesText.push(pageText);
  }

  // Join pages with two newlines for readability
  return pagesText.join("\n\n");
}
