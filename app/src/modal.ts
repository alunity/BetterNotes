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
  // Get DOM elements
  const modalElement = document.getElementById("settingsModal");
  const importBTN = document.getElementById("importFS");
  const exportBTN = document.getElementById("exportFS");
  const applePencil = document.getElementById("applePencil");
  const smooth = document.getElementById("smooth");
  const interpolation = document.getElementById("interpolation");
  const debug = document.getElementById("debug");

  // Check if the elements exist
  if (
    modalElement &&
    importBTN &&
    exportBTN &&
    applePencil &&
    smooth &&
    interpolation &&
    debug
  ) {
    // Create a new Bootstrap modal
    const modal = new Modal(modalElement);

    // Clone the buttons and checkboxes
    const nImportBTN = importBTN.cloneNode(true);
    const nExportBTN = exportBTN.cloneNode(true);
    const nApplePencil = applePencil.cloneNode(true) as HTMLInputElement;
    const nSmooth = smooth.cloneNode(true) as HTMLInputElement;
    const nInterpolation = interpolation.cloneNode(true) as HTMLInputElement;
    const nDebug = debug.cloneNode(true) as HTMLInputElement;

    // Replace the old buttons and checkboxes with the new ones
    importBTN.replaceWith(nImportBTN);
    exportBTN.replaceWith(nExportBTN);
    applePencil.replaceWith(nApplePencil);
    smooth.replaceWith(nSmooth);
    interpolation.replaceWith(nInterpolation);
    debug.replaceWith(nDebug);

    // Add a click event listener to the import button
    nImportBTN.addEventListener("click", () => {
      // On click, open the file window to import data
      createFileWindow(handleImport);
    });

    // Add a click event listener to the export button
    nExportBTN.addEventListener("click", () => {
      // On click, download the file system data as a .bn file
      download("notes.bn", JSON.stringify(root.toJSON()));
    });

    // Set the checked state of the checkboxes based on the canvas options
    nApplePencil.checked = options.onlyWriteWithApplePencil;
    nSmooth.checked = options.smooth;
    nInterpolation.checked = options.linearInterpolation;
    nDebug.checked = options.debug;

    // Add a change event listener to the Apple Pencil checkbox
    nApplePencil.addEventListener("change", () => {
      // On change, update the canvas option and save the canvas options
      options.onlyWriteWithApplePencil = nApplePencil.checked;
      saveCanvasOptions(options);
    });

    // Add a change event listener to the Smooth checkbox
    nSmooth.addEventListener("change", () => {
      // On change, update the canvas option and save the canvas options
      options.smooth = nSmooth.checked;
      saveCanvasOptions(options);
    });

    // Add a change event listener to the Interpolation checkbox
    nInterpolation.addEventListener("change", () => {
      // On change, update the canvas option and save the canvas options
      options.linearInterpolation = nInterpolation.checked;
      saveCanvasOptions(options);
    });

    // Add a change event listener to the Debug checkbox
    nDebug.addEventListener("change", () => {
      // On change, update the canvas option and save the canvas options
      options.debug = nDebug.checked;
      saveCanvasOptions(options);
    });

    // Show the modal
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
  // Get DOM elements
  const modalElement = document.getElementById("moveModal");
  const input = document.getElementById("pathInput") as HTMLInputElement;
  const moveBTN = document.getElementById("moveBTN") as HTMLButtonElement;

  // Check if the elements exist
  if (input && moveBTN && modalElement) {
    // Clone the input and button
    const nInput = input.cloneNode(true) as HTMLInputElement;
    const nBTN = moveBTN.cloneNode(true) as HTMLButtonElement;

    // Set the value of the input to the current file system path
    nInput.value = evaluateFSPathName(curr);

    // Update the button's disabled status based on whether the input value is a valid file system path and not the same as the item name
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

    // Create a new Bootstrap modal and show it
    const modal = new Modal(modalElement);
    modal.show();

    // Add an input event listener to the input
    nInput.addEventListener("input", () => {
      // On input, update the button's disabled status
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

    // Add a click event listener to the button
    nBTN.addEventListener("click", () => {
      // On click, move the item to the path specified by the input value, save the data to disk, and render the files
      moveFSItem(root, curr, item, fileHandler, nInput.value);
      renderFiles();
    });

    // Replace the old input and button with the new ones
    input.replaceWith(nInput);
    moveBTN.replaceWith(nBTN);
  }
}

function searchModal(
  openNote: (note: Note) => void,
  findFSItem: (name: string) => Number | FileSystemNode | Note
) {
  // Get DOM elements
  const modalElement = document.getElementById("searchModal");
  const input = document.getElementById("searchInput") as HTMLInputElement;
  const searchBTN = document.getElementById("searchBTN") as HTMLButtonElement;

  // Initialize a variable to store the note or file system node to be found
  let note: Number | Note | FileSystemNode = -1;

  // Check if the elements exist
  if (modalElement && input && searchBTN) {
    // Clone the input and button
    const nInput = input.cloneNode(true) as HTMLInputElement;
    const nBTN = searchBTN.cloneNode(true) as HTMLButtonElement;

    // Disable the button
    nBTN.classList.add("disabled");

    // Clear the input value
    nInput.value = "";

    // Add an input event listener to the input
    nInput.addEventListener("input", (e: Event) => {
      // On input, find the note or file system node with the input value
      const input = e.target as HTMLInputElement;
      note = findFSItem(input.value);

      // If the note or file system node is found, enable the button; otherwise, disable the button
      if (note instanceof Note) {
        nBTN.classList.remove("disabled");
      } else {
        nBTN.classList.add("disabled");
      }
    });

    // Add a click event listener to the button
    nBTN.addEventListener("click", () => {
      // On click, if the note is found, open the note
      if (note instanceof Note) {
        openNote(note);
      }
    });

    // Replace the old input and button with the new ones
    input.replaceWith(nInput);
    searchBTN.replaceWith(nBTN);

    // Create a new Bootstrap modal and show it
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

    // Store elements showing images of templates
    const options: Array<HTMLDivElement> = [];
    let selected = 0;

    let noteSelected = true;
    let name = "";

    // Handle notes or directory buttons
    function handleButton(
      noteBTN: HTMLElement,
      directoryBTN: HTMLElement,
      templateDiv: HTMLElement
    ) {
      if (noteSelected) {
        // Apply styles to buttons if template is selected
        noteBTN.classList.remove("btn-outline-primary");
        noteBTN.classList.add("btn-primary");

        directoryBTN.classList.add("btn-outline-success");
        directoryBTN.classList.remove("btn-success");

        templateDiv.classList.remove("hide");
      } else {
        // Apply styles to buttons if template is not selected
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
      // Ensure that a unique name is entered
      // If not, don't allow note to be created
      if (name.length === 0 || FindFSItem(name) !== -1) {
        createBTN.classList.add("disabled");
      } else {
        createBTN.classList.remove("disabled");
      }
    });

    // Update button listeners
    handleButton(noteBTN, directoryBTN, templateDiv);

    noteBTN.addEventListener("click", () => {
      noteSelected = true;
      // Update button listeners when switching to note being created
      handleButton(noteBTN, directoryBTN, templateDiv);
    });

    directoryBTN.addEventListener("click", () => {
      noteSelected = false;
      // Update button listeners when switching to directory being created
      handleButton(noteBTN, directoryBTN, templateDiv);
    });

    createBTN.addEventListener("click", () => {
      // Create note or directory
      if (noteSelected) {
        createNote(name, templates[selected][1]);
      } else {
        createDirectory(name);
      }
      // Reset inputs
      nameInput.value = "";
      createBTN.classList.add("disabled");
    });

    for (let i = 0; i < templates.length; i++) {
      // Create template images to for selection
      const div = document.createElement("div");
      options.push(div);

      div.addEventListener("click", () => {
        // When template is clicked, add a glow to the template
        // Remove glow from any other templates
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

      // Create template element
      p.innerText = templates[i][0];
      const img = new Image();
      // Download PDF to create image thumbnail for template
      img.src = (await downloadPDF(templates[i][1]))[0];
      img.width = 200;
      img.height = 200;
      img.classList.add("p-3");
      div.appendChild(img);
      div.appendChild(p);
      templateElement.appendChild(div);
    }

    // Hide loading when template elements have finished loading
    templateLoading.classList.add("hide");
    templateElement.classList.remove("hide");
  }
}

export { createNoteModal, getNoteModal, moveModal, settingModal, searchModal };
