// Import the pdfjs library
import * as pdfjs from "pdfjs-dist";

// Define an asynchronous function to download a PDF from a given URL
async function downloadPDF(url: string) {
  // If the worker source for pdfjs is not set, set it to the CDN URL
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;
  }

  // Start the task of getting the document
  const loadingTask = await pdfjs.getDocument(url);
  // Wait for the document to be loaded
  const pdf = await loadingTask.promise;

  // Initialize an array to hold the pages of the PDF
  const pages: Array<string> = [];

  // Define an asynchronous function to get a page from the PDF
  async function getPage(pageNumber: number) {
    // Get the page from the PDF
    const page = await pdf.getPage(pageNumber);
    const scale = 3;
    // Get the viewport of the page at the specified scale
    const viewport = page.getViewport({ scale: scale });

    // Create a canvas and get its 2D context
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    // Set the canvas dimensions to match the viewport
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // If the context is not null, render the page into the context
    if (context !== null) {
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      // Render the page and then convert the canvas to a PNG data URL
      await page.render(renderContext).promise.then(() => {
        const img = canvas.toDataURL("image/png");
        // Add the data URL to the pages array
        pages.push(img);
      });
    }
  }

  // Get all the pages from the PDF
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    await getPage(pageNumber);
  }
  // Return the array of pages
  return pages;
}

// Export the downloadPDF function as the default export
export default downloadPDF;
