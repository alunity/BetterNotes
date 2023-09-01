import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "./style.css";
import { createNoteModal, getNoteModal } from "./modal";
import { Canvas, ToolBar } from "./canvas";
import { FileSystemNode, Note } from "./file";
import downloadPDF from "./pdf";

const FS = new FileSystemNode();

async function documents() {
  const newNote = document.getElementById("newNote");
  renderFile();
  if (newNote !== null) {
    createNoteModal(createNote);
    const modal = await getNoteModal();
    if (modal) {
      newNote.addEventListener("click", () => {
        modal.show();
      });
    }
  }
}

function renderFile() {
  console.log(FS);

  const files = document.getElementById("files");
  if (files) {
    files.innerHTML = "";
    for (let i = 0; i < FS.notes.length; i++) {
      const div = document.createElement("div");
      div.classList.add("violet-bg");
      div.classList.add("container");
      div.classList.add("p-3");
      div.classList.add("border");
      div.classList.add("border-dark");
      div.classList.add("glow");
      div.innerHTML = FS.notes[i].name;

      div.addEventListener("click", () => openNote(FS.notes[i]));

      files.appendChild(div);
    }
  }
}

function openDocuments() {
  const documentElement = document.getElementById("documents");
  const toolBarElement = document.getElementById("toolbar");
  const canvasDiv = document.getElementById("canvas");
  renderFile();

  if (documentElement && toolBarElement && canvasDiv) {
    documentElement.classList.remove("hide");

    canvasDiv.innerHTML = "";
    toolBarElement.classList.add("hide");
  }
}

async function createNote(name: string, template: string) {
  const note = new Note(name);
  note.data.backgrounds = await downloadPDF(template);
  FS.addNote(note);
  openNote(note);
}

function openNote(note: Note) {
  const documentElement = document.getElementById("documents");
  const toolBarElement = document.getElementById("toolbar");
  const canvasDiv = document.getElementById("canvas");
  if (documentElement && toolBarElement && canvasDiv) {
    documentElement.classList.add("hide");
    toolBarElement.classList.remove("hide");

    const canvas = new Canvas(
      window.innerWidth,
      window.innerHeight - toolBarElement.clientHeight,
      note
    );

    ToolBar(canvas, openDocuments);

    canvasDiv.appendChild(canvas.element);
  }
}

documents();
