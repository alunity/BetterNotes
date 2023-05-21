import * as pdfjs from "pdfjs-dist";

async function importPDF(canvas: HTMLCanvasElement, url: string) {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;
  }
  let loadingTask = await pdfjs.getDocument(url);
  let pdf = await loadingTask.promise;

  let pages: Array<string> = [];

  async function getPage(pageNumber: number) {
    let page = await pdf.getPage(pageNumber);
    var scale = 1.5;
    var viewport = page.getViewport({ scale: scale });

    // Prepare canvas using PDF page dimensions
    var context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    var renderTask = await page.render(renderContext).promise.then(() => {
      const img = canvas.toDataURL("image/png");
      pages.push(img);
    });
  }

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    await getPage(pageNumber);
  }
  return pages;
}

// function resolveAfter1Seconds() {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve("Hi");
//     }, 1000);
//   });
// }

// async function renderPDF(canvas: HTMLCanvasElement, url: string) {
//   for (let i = 0; i < 10; i++) {
//     console.log(await resolveAfter1Seconds());
//   }
// }

export default importPDF;
