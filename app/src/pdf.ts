import * as pdfjs from "pdfjs-dist";

async function downloadPDF(url: string) {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;
  }
  const loadingTask = await pdfjs.getDocument(url);
  const pdf = await loadingTask.promise;

  const pages: Array<string> = [];

  async function getPage(pageNumber: number) {
    const page = await pdf.getPage(pageNumber);
    const scale = 3;
    const viewport = page.getViewport({ scale: scale });

    // Prepare canvas using PDF page dimensions
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    if (context !== null) {
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise.then(() => {
        const img = canvas.toDataURL("image/png");
        pages.push(img);
      });
    }
  }

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    await getPage(pageNumber);
  }
  return pages;
}

export default downloadPDF;
