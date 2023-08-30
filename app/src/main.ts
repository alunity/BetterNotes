import drawing from "./canvas";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "./style.css";
import { createNoteModal } from "./modal";

function toolBar(mainCanvas: drawing) {
  const penBTN = document.getElementById("pen");
  const eraserBTN = document.getElementById("eraser");
  const addBTN = document.getElementById("add");

  if (
    penBTN !== null &&
    eraserBTN !== null &&
    addBTN !== null &&
    toolbar !== null
  ) {
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

  addBTN?.addEventListener("click", () => {
    mainCanvas.addBackground();
  });
}

function documents() {
  const newNote = document.getElementById("newNote");
  if (newNote !== null) {
    newNote.addEventListener("click", () => {
      createNoteModal();
    });
  }
}

function render() {
  const element = document.createElement("div");
  documents();

  return element;
}

document.body.appendChild(render());
