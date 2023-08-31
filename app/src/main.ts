import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "./style.css";
import { createNoteModal } from "./modal";
import { Canvas, toolBar } from "./canvas";

function documents() {
  const newNote = document.getElementById("newNote");
  if (newNote !== null) {
    newNote.addEventListener("click", () => {
      createNoteModal(createNote);
    });
  }
}

function createNote(name: string, template: string) {
  const documentElement = document.getElementById("documents");
  const toolbar = document.getElementById("toolbar");
  const canvasDiv = document.getElementById("canvas");
  if (documentElement !== null && toolbar !== null && canvasDiv !== null) {
    documentElement.classList.add("hide");
    toolbar.classList.remove("hide");

    const canvas = new Canvas(
      window.innerWidth,
      window.innerHeight - toolbar.clientHeight
    );

    toolBar(canvas);

    canvasDiv.appendChild(canvas.element);
    canvas.setTemplate(template);
  }
}

documents();
