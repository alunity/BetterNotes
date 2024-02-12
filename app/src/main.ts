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
import {
  FileSystemNode,
  Note,
  evaluateFSPathName,
  findFSItem,
  getFileHandler,
  loadCanvasOptions,
  saveDataToDisk,
} from "./file";
import downloadPDF from "./pdf";

// Initialise variable to store object which allows for data to be saved
let fileHandler: FileSystemFileHandle;

// Create varialbes to store the file system
let FS = new FileSystemNode();
let root = FS;

// Initialise the canvas options
const canvasOptions: iCanvasOptions = loadCanvasOptions();

function handleImport(data: string) {
  // Create file system using imported data
  FS = FileSystemNode.fromJSON(JSON.parse(data));

  // Set the imported file system as the root
  root = FS;

  // Update the document view
  renderFiles();
}

async function documents() {
  // Aquire elements so that they can be updated
  const newNote = document.getElementById("newNote");
  const back = document.getElementById("back");
  const logo = document.getElementById("logo");
  const search = document.getElementById("search");

  // Update the document view
  renderFiles();
  if (newNote && back && logo && search) {
    back.addEventListener("click", () => {
      if (FS.root) {
        // To go back, traverse to the root of the current file system node
        FS = FS.root;
        renderFiles();
      }
    });

    logo.addEventListener("click", () => {
      // When logo is clicked, open settings modal
      settingModal(root, handleImport, canvasOptions);
    });

    search.addEventListener("click", () => {
      // When search icon is clicked, open search modal
      searchModal(
        (note: Note) => openNote(note),
        (name: string) => findFSItem(name, root)
      );
    });

    // Initialise the create note modal
    createNoteModal(createNote, createDirectory, (name: string) =>
      findFSItem(name, root)
    );
    const modal = await getNoteModal();
    if (modal) {
      newNote.addEventListener("click", () => {
        // Open create note modal when new note button is clicked
        modal.show();
      });
    }
  }
}

function renderFiles() {
  // Get DOM elements
  const back = document.getElementById("back");
  const files = document.getElementById("files");
  const path = document.getElementById("path");

  // Check if the elements exist
  if (files && back && path) {
    // Update the path element with the current file system path
    path.innerHTML = evaluateFSPathName(FS);

    // If there is no root directory, hide the back button
    if (!FS.root) {
      back.classList.add("hide");
    } else {
      // Otherwise, show the back button
      back.classList.remove("hide");
    }

    // Clear the files element
    files.innerHTML = "";

    // Loop through the notes in the file system
    for (let i = 0; i < FS.notes.length; i++) {
      // Create a new div for each note and add classes
      const div = document.createElement("div");
      div.classList.add(
        "violet-bg",
        "container",
        "p-3",
        "border",
        "border-dark",
        "glow"
      );

      // Create an image element for the note icon and set its properties
      const noteIcon = document.createElement("img");
      noteIcon.src = "notes.svg";
      noteIcon.width = 40;
      noteIcon.height = 40;
      div.appendChild(noteIcon);

      // Create a span element for the note name and set its content
      const span = document.createElement("span");
      span.innerHTML = " " + FS.notes[i].name;
      div.appendChild(span);

      // Create an image element for the delete icon, set its properties, and add a click event listener
      const deleteIcon = document.createElement("img");
      deleteIcon.src = "trash.svg";
      deleteIcon.width = 40;
      deleteIcon.height = 40;
      deleteIcon.classList.add("float-right");
      deleteIcon.id = "delete";
      deleteIcon.addEventListener("click", () => {
        // On click, remove the note from the file system and re-render the files
        FS.notes.splice(i, 1);
        renderFiles();
      });
      div.appendChild(deleteIcon);

      // Similar to the delete icon, create a move icon and add a click event listener
      const moveIcon = document.createElement("img");
      moveIcon.src = "arrows-exchange-alt.svg";
      moveIcon.width = 40;
      moveIcon.height = 40;
      moveIcon.classList.add("float-right");
      moveIcon.id = "move";
      moveIcon.addEventListener("click", () => {
        // On click, open the move modal
        moveModal(root, FS, FS.notes[i], fileHandler, renderFiles);
      });
      div.appendChild(moveIcon);

      // Add a click event listener to the div
      div.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        // If the clicked element is not the delete or move icon, open the note
        if (target.id !== "delete" && target.id !== "move") {
          openNote(FS.notes[i]);
        }
      });

      // Append the div to the files element
      files.appendChild(div);
    }

    // Similar to the notes, loop through the directories in the file system
    for (let i = 0; i < FS.directories.length; i++) {
      // Create a new div for each directory and add classes
      const div = document.createElement("div");
      div.classList.add(
        "violet-bg",
        "container",
        "p-3",
        "border",
        "border-dark",
        "glow"
      );

      // Create an image element for the folder icon and set its properties
      const folderIcon = document.createElement("img");
      folderIcon.src = "folder.svg";
      folderIcon.width = 40;
      folderIcon.height = 40;
      div.appendChild(folderIcon);

      // Create a span element for the directory name and set its content
      const span = document.createElement("span");
      span.innerHTML = " " + FS.directories[i].name;
      div.appendChild(span);

      // Similar to the notes, create a delete icon and add a click event listener
      const deleteIcon = document.createElement("img");
      deleteIcon.src = "trash.svg";
      deleteIcon.width = 40;
      deleteIcon.height = 40;
      deleteIcon.classList.add("float-right");
      deleteIcon.id = "delete";
      deleteIcon.addEventListener("click", () => {
        // On click, remove the directory from the file system, save the data to disk, and re-render the files
        FS.directories.splice(i, 1);
        saveDataToDisk(fileHandler, JSON.stringify(root.toJSON()));
        renderFiles();
      });
      div.appendChild(deleteIcon);

      // Similar to the notes, create a move icon and add a click event listener
      const moveIcon = document.createElement("img");
      moveIcon.src = "arrows-exchange-alt.svg";
      moveIcon.width = 40;
      moveIcon.height = 40;
      moveIcon.classList.add("float-right");
      moveIcon.id = "move";
      moveIcon.addEventListener("click", () => {
        // On click, open the move modal
        moveModal(root, FS, FS.directories[i], fileHandler, renderFiles);
      });
      div.appendChild(moveIcon);

      // Add a click event listener to the div
      div.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        // If the clicked element is not the delete or move icon, set the current file system to the clicked directory and re-render the files
        if (target.id !== "delete" && target.id !== "move") {
          FS = FS.directories[i];
          renderFiles();
        }
      });

      // Append the div to the files element
      files.appendChild(div);
    }
  }
}

// This function is used to open the documents view. It hides the toolbar and canvas, and shows the documents.
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

// This asynchronous function is used to create a new note. It downloads a PDF template, adds the note to the file system, saves the data to disk, and opens the note.
async function createNote(name: string, template: string) {
  const note = new Note(name);
  note.data.backgrounds = await downloadPDF(template);
  FS.addNote(note);
  saveDataToDisk(fileHandler, JSON.stringify(root.toJSON()));
  openNote(note);
}

// This function is used to create a new directory. It adds the directory to the file system and saves the data to disk.
function createDirectory(name: string) {
  FS.addDirectory(new FileSystemNode(name, FS));
  saveDataToDisk(fileHandler, JSON.stringify(root.toJSON()));
  renderFiles();
}

// This function is used to open a note. It hides the documents view, shows the toolbar and canvas, and adds the note to the canvas.
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
      canvasOptions,
      () => saveDataToDisk(fileHandler, JSON.stringify(root.toJSON()))
    );

    ToolBar(canvas, openDocuments);
    canvasDiv.appendChild(canvas.element);
  }
}

// This asynchronous function is used to start the application. It adds event listeners to the import, create, and noSave buttons.
async function start() {
  const importBTN = document.getElementById("import");
  const createBTN = document.getElementById("create");
  const noSaveBTN = document.getElementById("noSave");

  if (importBTN && createBTN && noSaveBTN) {
    importBTN.addEventListener("click", async () => {
      fileHandler = await getFileHandler(false);
      handleImportFile(fileHandler);
    });
    createBTN.addEventListener("click", async () => {
      fileHandler = await getFileHandler(true);
      handleStartApp();
    });

    noSaveBTN.addEventListener("click", () => handleStartApp());
  }

  // This asynchronous function is used to handle the import of a file. It reads the file, imports the data, and starts the application.
  async function handleImportFile(fileHandler: FileSystemFileHandle) {
    try {
      handleImport(await (await fileHandler.getFile()).text());
      handleStartApp();
    } catch {
      alert("Invalid .bn file");
    }
  }
}

// This function is used to handle the start of the application. It shows the documents view and hides the start view.
function handleStartApp() {
  const documents = document.getElementById("documents");
  const startElement = document.getElementById("start");

  if (documents && startElement) {
    documents.classList.remove("hide");
    startElement.classList.add("hide");
  }
}

// Start the application and open the documents view.
start();
documents();
