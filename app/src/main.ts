import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "./style.css";
import { createNoteModal, getNoteModal } from "./modal";
import { Canvas, ToolBar } from "./canvas";
import { FileSystemNode, Note } from "./file";
import downloadPDF from "./pdf";

let FS = new FileSystemNode();

async function documents() {
  const newNote = document.getElementById("newNote");
  const back = document.getElementById("back");
  renderFiles();
  if (newNote && back) {
    back.addEventListener("click", () => {
      if (FS.root !== null) {
        FS = FS.root;
        renderFiles();
      }
    });

    createNoteModal(createNote, createDirectory);
    const modal = await getNoteModal();
    if (modal) {
      newNote.addEventListener("click", () => {
        modal.show();
      });
    }
  }
}

function renderFiles() {
  const back = document.getElementById("back");
  const files = document.getElementById("files");
  if (files && back) {
    if (FS.isRoot) {
      back.classList.add("hide");
    } else {
      back.classList.remove("hide");
    }

    files.innerHTML = "";
    for (let i = 0; i < FS.notes.length; i++) {
      const div = document.createElement("div");
      div.classList.add("violet-bg");
      div.classList.add("container");
      div.classList.add("p-3");
      div.classList.add("border");
      div.classList.add("border-dark");
      div.classList.add("glow");

      const img = document.createElement("img");
      img.src = "/notes.svg";
      img.width = 40;
      img.height = 40;
      div.appendChild(img);

      const span = document.createElement("span");
      span.innerHTML = " " + FS.notes[i].name;
      div.appendChild(span);

      div.addEventListener("click", () => openNote(FS.notes[i]));

      files.appendChild(div);
    }

    for (let i = 0; i < FS.directories.length; i++) {
      const div = document.createElement("div");
      div.classList.add("violet-bg");
      div.classList.add("container");
      div.classList.add("p-3");
      div.classList.add("border");
      div.classList.add("border-dark");
      div.classList.add("glow");

      const img = document.createElement("img");
      img.src = "/folder.svg";
      img.width = 40;
      img.height = 40;
      div.appendChild(img);

      const span = document.createElement("span");
      span.innerHTML = " " + FS.directories[i].name;
      div.appendChild(span);

      div.addEventListener("click", () => {
        FS = FS.directories[i];
        renderFiles();
      });

      files.appendChild(div);
    }
  }
}

function openDocuments() {
  const documentElement = document.getElementById("documents");
  const toolBarElement = document.getElementById("toolbar");
  const canvasDiv = document.getElementById("canvas");
  renderFiles();

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

function createDirectory(name: string) {
  FS.addDirectory(new FileSystemNode(name, FS));
  renderFiles();
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
