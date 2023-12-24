import { Modal } from "bootstrap";
import {
  FileSystemNode,
  Note,
  createFileWindow,
  download,
  evaluateFSPathName,
  isValidFSPath,
  moveFSItem,
  saveCanvasOptions,
} from "./file";
import downloadPDF from "./pdf";
import { iCanvasOptions } from "./canvas";

const templates = [
  [
    "White Plain",
    "https://raw.githubusercontent.com/alunity/BetterNotes/5daf74c/Templates/White%20Plain.pdf",
  ],
  [
    "White Lined",
    "https://raw.githubusercontent.com/alunity/BetterNotes/5daf74c/Templates/White%20Lined.pdf",
  ],
  [
    "White Grid",
    "https://raw.githubusercontent.com/alunity/BetterNotes/5daf74c/Templates/White%20Grid.pdf",
  ],
  [
    "Yellow Plain",
    "https://raw.githubusercontent.com/alunity/BetterNotes/5daf74c/Templates/Yellow%20Plain.pdf",
  ],
  [
    "Yellow Lined",
    "https://raw.githubusercontent.com/alunity/BetterNotes/5daf74c/Templates/Yellow%20Lined.pdf",
  ],
  [
    "Yellow Grid",
    "https://raw.githubusercontent.com/alunity/BetterNotes/5daf74c/Templates/Yellow%20Grid.pdf",
  ],
  [
    "Dark Plain",
    "https://raw.githubusercontent.com/alunity/BetterNotes/5daf74c/Templates/Dark%20Plain.pdf",
  ],
  [
    "Dark Lined",
    "https://raw.githubusercontent.com/alunity/BetterNotes/5daf74c/Templates/Dark%20Lined.pdf",
  ],
  [
    "Dark Grid",
    "https://raw.githubusercontent.com/alunity/BetterNotes/5daf74c/Templates/Dark%20Grid.pdf",
  ],

  // [
  //   "Dark Grid",
  //   "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Grid/Grid-5mm-Portrait-Dark.pdf",
  // ],
  // [
  //   "Dark plain",
  //   "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Plain/Portrait-Dark.pdf",
  // ],
  // [
  //   "Dark lined",
  //   "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Lined-College/Lined-Ruled-Portrait-Dark.pdf",
  // ],
];

function settingModal(
  root: FileSystemNode,
  handleImport: (data: string) => void,
  options: iCanvasOptions
) {
  const modalElement = document.getElementById("settingsModal");
  const importBTN = document.getElementById("importFS");
  const exportBTN = document.getElementById("exportFS");

  const drawingTablet = document.getElementById("drawingTablet");
  const smooth = document.getElementById("smooth");
  const interpolation = document.getElementById("interpolation");
  const debug = document.getElementById("debug");
  if (
    modalElement &&
    importBTN &&
    exportBTN &&
    drawingTablet &&
    smooth &&
    interpolation &&
    debug
  ) {
    const modal = new Modal(modalElement);

    const nImportBTN = importBTN.cloneNode(true);
    const nExportBTN = exportBTN.cloneNode(true);
    const nDrawingTablet = drawingTablet.cloneNode(true) as HTMLInputElement;
    const nSmooth = smooth.cloneNode(true) as HTMLInputElement;
    const nInterpolation = interpolation.cloneNode(true) as HTMLInputElement;
    const nDebug = debug.cloneNode(true) as HTMLInputElement;

    importBTN.replaceWith(nImportBTN);
    exportBTN.replaceWith(nExportBTN);
    drawingTablet.replaceWith(nDrawingTablet);
    smooth.replaceWith(nSmooth);
    interpolation.replaceWith(nInterpolation);
    debug.replaceWith(nDebug);

    nImportBTN.addEventListener("click", () => {
      createFileWindow(handleImport);
    });
    nExportBTN.addEventListener("click", () => {
      download("notes.bn", JSON.stringify(root.toJSON()));
    });

    nDrawingTablet.checked = options.treatTouchAsStylus;
    nSmooth.checked = options.smooth;
    nInterpolation.checked = options.linearInterpolation;
    nDebug.checked = options.debug;

    nDrawingTablet.addEventListener("change", () => {
      options.treatTouchAsStylus = nDrawingTablet.checked;
      saveCanvasOptions(options);
    });
    nSmooth.addEventListener("change", () => {
      options.smooth = nSmooth.checked;
      saveCanvasOptions(options);
    });
    nInterpolation.addEventListener("change", () => {
      options.linearInterpolation = nInterpolation.checked;
      saveCanvasOptions(options);
    });
    nDebug.addEventListener("change", () => {
      options.debug = nDebug.checked;
      saveCanvasOptions(options);
    });
    modal.show();
  }
}

function moveModal(
  root: FileSystemNode,
  curr: FileSystemNode,
  item: FileSystemNode | Note,
  fileHandler: FileSystemFileHandle,
  renderFiles: () => void
) {
  const modalElement = document.getElementById("moveModal");
  const input = document.getElementById("pathInput") as HTMLInputElement;
  const moveBTN = document.getElementById("moveBTN") as HTMLButtonElement;
  if (input && moveBTN && modalElement) {
    const nInput = input.cloneNode(true) as HTMLInputElement;
    const nBTN = moveBTN.cloneNode(true) as HTMLButtonElement;

    nInput.value = evaluateFSPathName(curr);

    // Update button's disabled status
    if (
      isValidFSPath(root, nInput.value) &&
      nInput.value
        .split("/")
        [nInput.value.split("/").length - 1].toLowerCase() !==
        item.name.toLowerCase()
    ) {
      nBTN.classList.remove("disabled");
    } else {
      nBTN.classList.add("disabled");
    }

    const modal = new Modal(modalElement);
    modal.show();

    nInput.addEventListener("input", () => {
      if (
        isValidFSPath(root, nInput.value) &&
        nInput.value
          .split("/")
          [nInput.value.split("/").length - 1].toLowerCase() !==
          item.name.toLowerCase()
      ) {
        nBTN.classList.remove("disabled");
      } else {
        nBTN.classList.add("disabled");
      }
    });

    nBTN.addEventListener("click", () => {
      moveFSItem(root, curr, item, fileHandler, nInput.value);
      renderFiles();
    });
    input.replaceWith(nInput);
    moveBTN.replaceWith(nBTN);
  }
}

function searchModal(
  openNote: (note: Note) => void,
  findFSItem: (name: string) => Number | FileSystemNode | Note
) {
  const modalElement = document.getElementById("searchModal");
  const input = document.getElementById("searchInput") as HTMLInputElement;
  const searchBTN = document.getElementById("searchBTN") as HTMLButtonElement;
  let note: Number | Note | FileSystemNode = -1;
  if (modalElement && input && searchBTN) {
    const nInput = input.cloneNode(true) as HTMLInputElement;
    const nBTN = searchBTN.cloneNode(true) as HTMLButtonElement;
    nBTN.classList.add("disabled");

    nInput.value = "";

    nInput.addEventListener("input", (e: Event) => {
      const input = e.target as HTMLInputElement;
      note = findFSItem(input.value);

      if (note instanceof Note) {
        nBTN.classList.remove("disabled");
      } else {
        nBTN.classList.add("disabled");
      }
    });

    nBTN.addEventListener("click", () => {
      if (note instanceof Note) {
        openNote(note);
      }
    });

    input.replaceWith(nInput);
    searchBTN.replaceWith(nBTN);

    const modal = new Modal(modalElement);
    modal.show();
  }
}

async function getNoteModal() {
  const modalElement = document.getElementById("createNoteModal");
  if (modalElement) {
    return await new Modal(modalElement);
  }
}

async function createNoteModal(
  createNote: (name: string, template: string) => void,
  createDirectory: (name: string) => void,
  FindFSItem: (name: string) => Number | FileSystemNode | Note
) {
  const templateElement = document.getElementById("templates");
  const templateLoading = document.getElementById("templateImageLoading");
  const templateDiv = document.getElementById("templateDiv");

  const noteBTN = document.getElementById("selectNote");
  const directoryBTN = document.getElementById("selectDirectory");

  const nameInput = document.getElementById("nameInput") as HTMLInputElement;
  const createBTN = document.getElementById("createBTN");

  if (
    templateElement &&
    templateLoading &&
    noteBTN &&
    directoryBTN &&
    templateDiv &&
    nameInput &&
    createBTN
  ) {
    templateLoading.classList.remove("hide");
    templateElement.classList.add("hide");

    templateElement.innerHTML = "";
    nameInput.value = "";

    const options: Array<HTMLDivElement> = [];
    let selected = 0;

    let noteSelected = true;
    let name = "";

    // Handle notes or direcory buttons
    function handleButton(
      noteBTN: HTMLElement,
      directoryBTN: HTMLElement,
      templateDiv: HTMLElement
    ) {
      if (noteSelected) {
        noteBTN.classList.remove("btn-outline-primary");
        noteBTN.classList.add("btn-primary");

        directoryBTN.classList.add("btn-outline-success");
        directoryBTN.classList.remove("btn-success");

        templateDiv.classList.remove("hide");
      } else {
        noteBTN.classList.add("btn-outline-primary");
        noteBTN.classList.remove("btn-primary");

        directoryBTN.classList.remove("btn-outline-success");
        directoryBTN.classList.add("btn-success");

        templateDiv.classList.add("hide");
      }
    }

    nameInput.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      name = target.value;
      if (name.length === 0 || FindFSItem(name) !== -1) {
        createBTN.classList.add("disabled");
      } else {
        createBTN.classList.remove("disabled");
      }
    });

    handleButton(noteBTN, directoryBTN, templateDiv);

    noteBTN.addEventListener("click", () => {
      noteSelected = true;
      handleButton(noteBTN, directoryBTN, templateDiv);
    });

    directoryBTN.addEventListener("click", () => {
      noteSelected = false;
      handleButton(noteBTN, directoryBTN, templateDiv);
    });

    createBTN.addEventListener("click", () => {
      if (noteSelected) {
        createNote(name, templates[selected][1]);
      } else {
        createDirectory(name);
      }
      nameInput.value = "";
      createBTN.classList.add("disabled");
    });

    for (let i = 0; i < templates.length; i++) {
      const div = document.createElement("div");
      options.push(div);

      div.addEventListener("click", () => {
        for (let j = 0; j < options.length; j++) {
          options[j].classList.remove("selected");
          options[j].classList.add("selected-glow");
        }
        div.classList.add("selected");
        div.classList.remove("selected-glow");
        selected = i;
      });

      div.classList.add("inline");
      if (i === selected) {
        div.classList.add("selected");
      } else {
        div.classList.add("selected-glow");
      }

      const p = document.createElement("p");
      p.classList.add("center");

      p.innerText = templates[i][0];
      const img = new Image();
      img.src = (await downloadPDF(templates[i][1]))[0];
      img.width = 200;
      img.height = 200;
      img.classList.add("p-3");
      div.appendChild(img);
      div.appendChild(p);
      templateElement.appendChild(div);
    }

    templateLoading.classList.add("hide");
    templateElement.classList.remove("hide");
  }
}

export { createNoteModal, getNoteModal, moveModal, settingModal, searchModal };
