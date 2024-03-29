import { iCanvasOptions } from "./canvas";

interface noteData {
  strokes: Array<stroke>;
  backgrounds: Array<string>;
}

interface stroke {
  points: Array<Array<number>>;
  colour: string;
  thickness: number;
}

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
      this.data = { strokes: [], backgrounds: [] };
    }
  }

  toJSON() {
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

    for (let i = 0; i < this.notes.length; i++) {
      notes.push(this.notes[i].toJSON());
    }

    for (let i = 0; i < this.directories.length; i++) {
      directories.push(this.directories[i].toJSON());
    }
    return { name: this.name, notes: notes, directories: directories };
  }

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

function evaluateFSPathName(node: FileSystemNode) {
  const names = [];
  while (node.root) {
    names.unshift(node.name);
    node = node.root;
  }
  return names.join("/");
}

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
    // Directory
    curr.directories.splice(curr.directories.indexOf(item), 1);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < node.directories.length; j++) {
        if (node.directories[j].name.toLowerCase() === nodes[i].toLowerCase()) {
          node = node.directories[j];
          break;
        }
      }
    }
    node.directories.push(item);
    item.root = node;
  } else {
    // Note
    curr.notes.splice(curr.notes.indexOf(item), 1);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < node.directories.length; j++) {
        if (node.directories[j].name.toLowerCase() === nodes[i].toLowerCase()) {
          node = node.directories[j];
          break;
        }
      }
    }
    node.notes.push(item);
  }
  saveDataToDisk(fileHandler, JSON.stringify(root.toJSON()));
}

// Legacy file handle functions
function download(filename: string, data: string) {
  const element = document.createElement("a");
  element.href = "data:text/plain;charset=utf-8," + encodeURIComponent(data);
  element.download = filename;
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

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

async function saveDataToDisk(fileHandler: FileSystemFileHandle, data: string) {
  if (fileHandler) {
    const writableStream = await fileHandler.createWritable();
    await writableStream.write(data);
    await writableStream.close();
  } else {
    console.warn("No save mode enabled");
  }
}

function findFSItem(
  name: string,
  root: FileSystemNode
): FileSystemNode | Note | Number {
  for (let i = 0; i < root.notes.length; i++) {
    if (root.notes[i].name.toLowerCase() === name.toLowerCase()) {
      return root.notes[i];
    }
  }

  for (let i = 0; i < root.directories.length; i++) {
    if (root.directories[i].name.toLowerCase() === name.toLowerCase()) {
      return root.directories[i];
    }
  }

  for (let i = 0; i < root.directories.length; i++) {
    const result: FileSystemNode | Number | Note = findFSItem(
      name,
      root.directories[i]
    );
    if (result !== -1) {
      return result;
    }
  }

  return -1;
}

function saveCanvasOptions(canvasOptions: iCanvasOptions) {
  localStorage.options = JSON.stringify(canvasOptions);
}

function loadCanvasOptions(): iCanvasOptions {
  const options: string = localStorage.options;
  if (options === undefined) {
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
