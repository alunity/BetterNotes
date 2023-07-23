import drawing from "./canvas";
import importPDF from "./pdf";
import "./canvas.css";

const mainCanvas = new drawing(window.innerWidth - 25, window.innerHeight - 25);

async function setTemplates() {
  mainCanvas.background = await importPDF(
    // "https://arxiv.org/ftp/arxiv/papers/1304/1304.7653.pdf"
    "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Grid/Grid-5mm-Landscape-Dark.pdf"
  );
}

// https://github.com/flyguybravo/goodnotes/blob/main/Dark/Grid/Grid-5mm-Landscape-Dark.pdf

// "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Grid/Grid-5mm-Landscape-Dark.pdf"

// "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Lined-Narrow/Lined-Narrow-Ruled-Landscape-Dark.pdf"

function render() {
  const element = document.createElement("div");
  element.appendChild(mainCanvas.element);
  mainCanvas.element.classList.add("canvas");

  setTemplates();

  return element;
}

document.body.appendChild(render());
