import drawing from "./canvas";
import importPDF from "./pdf";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "./style.css";

const toolbar = document.getElementById("toolbar");
let toolbarHeight = 0;
if (toolbar !== null) {
  toolbarHeight = toolbar.clientHeight;
}

const mainCanvas = new drawing(
  window.innerWidth - 25,
  window.innerHeight - 25 - toolbarHeight
);

async function setTemplates() {
  mainCanvas.background = await importPDF(
    "https://arxiv.org/ftp/arxiv/papers/1304/1304.7653.pdf"
    // "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Grid/Grid-5mm-Landscape-Dark.pdf"
  );
}

function toolBar() {
  const penBTN = document.getElementById("pen");
  const eraserBTN = document.getElementById("eraser");

  if (penBTN !== null && eraserBTN !== null) {
    penBTN.addEventListener("click", () => {
      penBTN.className = "active";
      eraserBTN.className = "glow";

      mainCanvas.canDraw = true;
      mainCanvas.erasing = false;
    });
    eraserBTN.addEventListener("click", () => {
      eraserBTN.className = "active";
      penBTN.className = "glow";
      mainCanvas.canDraw = false;
      mainCanvas.erasing = true;
    });
  }
}

function render() {
  const element = document.createElement("div");
  element.appendChild(mainCanvas.element);

  setTemplates();
  toolBar();

  return element;
}

document.body.appendChild(render());
