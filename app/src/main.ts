import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "./style.css";
import {
  createNoteModal,
  getNoteModal,
  moveModal,
  searchModal,
  settingModal,
} from "./modal";
import { Canvas, ToolBar, iCanvasOptions } from "./canvas";
import { FileSystemNode, Note, evaluateFSPathName, findFSItem } from "./file";
import downloadPDF from "./pdf";

let FS = new FileSystemNode();
let root = FS;

const canvasOptions: iCanvasOptions = {
  smooth: true,
  linearInterpolation: true,
  treatTouchAsStylus: false,
  debug: false,
};

async function handleImport(data: string) {
  FS = FileSystemNode.fromJSON(JSON.parse(data));
  root = FS;
  renderFiles();
}

async function documents() {
  const newNote = document.getElementById("newNote");
  const back = document.getElementById("back");
  const logo = document.getElementById("logo");
  const search = document.getElementById("search");

  renderFiles();
  if (newNote && back && logo && search) {
    back.addEventListener("click", () => {
      if (FS.root) {
        FS = FS.root;
        renderFiles();
      }
    });

    logo.addEventListener("click", () => {
      settingModal(root, handleImport, canvasOptions);
    });

    search.addEventListener("click", () => {
      searchModal(
        (note: Note) => openNote(note),
        (name: string) => findFSItem(name, root)
      );
    });

    createNoteModal(createNote, createDirectory, (name: string) =>
      findFSItem(name, root)
    );
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
  const path = document.getElementById("path");

  if (files && back && path) {
    path.innerHTML = evaluateFSPathName(FS);
    if (!FS.root) {
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

      const noteIcon = document.createElement("img");
      noteIcon.src = "notes.svg";
      noteIcon.width = 40;
      noteIcon.height = 40;
      div.appendChild(noteIcon);

      const span = document.createElement("span");
      span.innerHTML = " " + FS.notes[i].name;
      div.appendChild(span);

      const deleteIcon = document.createElement("img");
      deleteIcon.src = "trash.svg";
      deleteIcon.width = 40;
      deleteIcon.height = 40;
      deleteIcon.classList.add("float-right");
      deleteIcon.id = "delete";
      deleteIcon.addEventListener("click", () => {
        FS.notes.splice(i, 1);
        renderFiles();
      });
      div.appendChild(deleteIcon);

      const moveIcon = document.createElement("img");
      moveIcon.src = "arrows-exchange-alt.svg";
      moveIcon.width = 40;
      moveIcon.height = 40;
      moveIcon.classList.add("float-right");
      moveIcon.id = "move";
      moveIcon.addEventListener("click", () => {
        moveModal(root, FS, FS.notes[i], renderFiles);
      });
      div.appendChild(moveIcon);

      div.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.id !== "delete" && target.id !== "move") {
          openNote(FS.notes[i]);
        }
      });

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

      const folderIcon = document.createElement("img");
      folderIcon.src = "folder.svg";
      folderIcon.width = 40;
      folderIcon.height = 40;
      div.appendChild(folderIcon);

      const span = document.createElement("span");
      span.innerHTML = " " + FS.directories[i].name;
      div.appendChild(span);

      const deleteIcon = document.createElement("img");
      deleteIcon.src = "trash.svg";
      deleteIcon.width = 40;
      deleteIcon.height = 40;
      deleteIcon.classList.add("float-right");
      deleteIcon.id = "delete";
      deleteIcon.addEventListener("click", () => {
        FS.directories.splice(i, 1);
        renderFiles();
      });
      div.appendChild(deleteIcon);

      const moveIcon = document.createElement("img");
      moveIcon.src = "arrows-exchange-alt.svg";
      moveIcon.width = 40;
      moveIcon.height = 40;
      moveIcon.classList.add("float-right");
      moveIcon.id = "move";
      moveIcon.addEventListener("click", () => {
        moveModal(root, FS, FS.directories[i], renderFiles);
      });
      div.appendChild(moveIcon);

      div.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.id !== "delete" && target.id !== "move") {
          FS = FS.directories[i];
          renderFiles();
        }
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
      note,
      canvasOptions
    );

    ToolBar(canvas, openDocuments);

    canvasDiv.appendChild(canvas.element);
  }
}

documents();
