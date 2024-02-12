import { iCanvasOptions } from "./canvas";

// Interface for note canvas data
interface noteData {
  strokes: Array<stroke>;
  backgrounds: Array<string>;
}

// Interface for strokes which make up an annotation
interface stroke {
  points: Array<Array<number>>;
  colour: string;
  thickness: number;
}

// Interface for JSON representation of FileSystemNode
interface JSONFileSystemNode {
  name: string;
  notes: Array<{ name: string; data: noteData }>;
  directories: Array<JSONFileSystemNode>;
}

class Note {
  name: string;
  data: noteData;

  constructor(name: string, data?: noteData) {
    this.name = name;
    if (data) {
      this.data = data;
    } else {
      // If no data is passed, set data to empty arrays
      this.data = { strokes: [], backgrounds: [] };
    }
  }

  toJSON() {
    // JSON representation of Note
    return { name: this.name, data: this.data };
  }
}

class FileSystemNode {
  directories: Array<FileSystemNode>;
  notes: Array<Note>;
  root: FileSystemNode | null = null;
  name: string;

  constructor(name?: string, root?: FileSystemNode) {
    if (name) {
      this.name = name;
    } else {
      // If no name is provided, set name to default "" (empty string)
      this.name = "";
    }

    if (root) {
      this.root = root;
    }

    this.directories = [];
    this.notes = [];
  }

  addNote(note: Note) {
    this.notes.push(note);
  }

  addDirectory(directory: FileSystemNode) {
    this.directories.push(directory);
  }

  toJSON(): JSONFileSystemNode {
    const directories = [];
    const notes = [];

    // Convert all notes to JSON
    for (let i = 0; i < this.notes.length; i++) {
      notes.push(this.notes[i].toJSON());
    }

    // Convert all directories to JSON
    for (let i = 0; i < this.directories.length; i++) {
      directories.push(this.directories[i].toJSON());
    }

    // Return JSON representation of FileSystemNode
    return { name: this.name, notes: notes, directories: directories };
  }

  // Static method allowing for FileSystemNode to be created from JSONFileSystemNode
  static fromJSON(data: JSONFileSystemNode, root?: FileSystemNode) {
    const node = new FileSystemNode();
    node.name = data.name;
    if (root) {
      node.root = root;
    } else {
      node.root = null;
    }

    for (let i = 0; i < data.notes.length; i++) {
      node.notes.push(new Note(data.notes[i].name, data.notes[i].data));
    }

    for (let i = 0; i < data.directories.length; i++) {
      node.directories.push(FileSystemNode.fromJSON(data.directories[i], node));
    }
    return node;
  }
}

// Recursively backtrack from a given node to obtain path name
function evaluateFSPathName(node: FileSystemNode) {
  const names = [];
  while (node.root) {
    names.unshift(node.name);
    node = node.root;
  }
  return names.join("/");
}

// Attempt to traverse a path
// If succesful the path is valid
// If not successful the path is invalid
function isValidFSPath(node: FileSystemNode, path: string): boolean {
  const directories = path.split("/");
  if (directories.length === 1 && directories[0] === "") {
    return true;
  }
  for (let i = 0; i < node.directories.length; i++) {
    if (
      node.directories[i].name.toLowerCase() == directories[0].toLowerCase()
    ) {
      return isValidFSPath(node.directories[i], directories.slice(1).join("/"));
    }
  }
  return false;
}

// Move directory or note from one directory to another
function moveFSItem(
  root: FileSystemNode,
  curr: FileSystemNode,
  item: FileSystemNode | Note,
  fileHandler: FileSystemFileHandle,
  path: string
) {
  let node = root;
  const nodes = path.split("/");
  if ("root" in item) {
    // Remove directory
    curr.directories.splice(curr.directories.indexOf(item), 1);

    // Traverse to desired new location
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < node.directories.length; j++) {
        if (node.directories[j].name.toLowerCase() === nodes[i].toLowerCase()) {
          node = node.directories[j];
          break;
        }
      }
    }

    // Add directory to new location
    node.directories.push(item);
    item.root = node;
  } else {
    // Remove directory

    // Traverse to desired new location
    curr.notes.splice(curr.notes.indexOf(item), 1);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < node.directories.length; j++) {
        if (node.directories[j].name.toLowerCase() === nodes[i].toLowerCase()) {
          node = node.directories[j];
          break;
        }
      }
    }

    // Add directory to new location
    node.notes.push(item);
  }

  // Save data to disk
  saveDataToDisk(fileHandler, JSON.stringify(root.toJSON()));
}

// Legacy file handle functions
// Download JSON to disk
function download(filename: string, data: string) {
  const element = document.createElement("a");
  element.href = "data:text/plain;charset=utf-8," + encodeURIComponent(data);
  element.download = filename;
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Create an operating system open file window to allow user to select file
function createFileWindow(callback: (data: string) => void) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".bn";

  inp.addEventListener("change", async () => {
    if (inp.files === null) {
      return;
    }
    const file = inp.files[0];

    if (file) {
      callback(await file.text());
    }
  });

  inp.click();
}

// New file handle functions
// Create an operating system open file window to allow user to select file to upload or create a BetterNotes save file
async function getFileHandler(newFile: boolean): Promise<FileSystemFileHandle> {
  const openPickerOpts = {
    types: [
      {
        description: "BetterNotes Filesystem",
        accept: {
          "application/json": [".bn"],
        },
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
  };

  let fileHandler: FileSystemFileHandle;

  if (newFile) {
    // @ts-ignore
    fileHandler = await window.showSaveFilePicker({
      suggestedName: "documents.bn",
      ...openPickerOpts,
    });
  } else {
    // @ts-ignore
    [fileHandler] = await window.showOpenFilePicker(openPickerOpts);
  }
  return fileHandler;
}

// Save note data to disk
async function saveDataToDisk(fileHandler: FileSystemFileHandle, data: string) {
  if (fileHandler) {
    const writableStream = await fileHandler.createWritable();
    await writableStream.write(data);
    await writableStream.close();
  } else {
    console.warn("No save mode enabled");
  }
}

// Find a note or directory, searching by name
// If the FSItem cannot be find, -1 is returned
function findFSItem(
  name: string,
  root: FileSystemNode
): FileSystemNode | Note | Number {
  // Search notes
  for (let i = 0; i < root.notes.length; i++) {
    if (root.notes[i].name.toLowerCase() === name.toLowerCase()) {
      return root.notes[i];
    }
  }

  // Search directories
  for (let i = 0; i < root.directories.length; i++) {
    if (root.directories[i].name.toLowerCase() === name.toLowerCase()) {
      return root.directories[i];
    }
  }

  for (let i = 0; i < root.directories.length; i++) {
    // Recursively traverse directories
    const result: FileSystemNode | Number | Note = findFSItem(
      name,
      root.directories[i]
    );
    if (result !== -1) {
      return result;
    }
  }

  // If no file is found, return -1
  return -1;
}

// Save canvas options to localstorage
function saveCanvasOptions(canvasOptions: iCanvasOptions) {
  localStorage.options = JSON.stringify(canvasOptions);
}

// Load canvas options from localstorage
function loadCanvasOptions(): iCanvasOptions {
  const options: string = localStorage.options;
  if (options === undefined) {
    // If no data is stored in localstorage, use default
    return {
      smooth: true,
      linearInterpolation: true,
      onlyWriteWithApplePencil: false,
      debug: false,
    };
  } else {
    return JSON.parse(options);
  }
}

export {
  createFileWindow,
  FileSystemNode,
  Note,
  type noteData,
  evaluateFSPathName,
  isValidFSPath,
  moveFSItem,
  download,
  findFSItem,
  saveCanvasOptions,
  loadCanvasOptions,
  getFileHandler,
  saveDataToDisk,
};
