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
    if (node.directories[i].name == directories[0]) {
      return isValidFSPath(node.directories[i], directories.slice(1).join("/"));
    }
  }
  return false;
}

function moveFSItem(
  root: FileSystemNode,
  curr: FileSystemNode,
  item: FileSystemNode | Note,
  path: string
) {
  let node = root;
  const nodes = path.split("/");
  if ("root" in item) {
    // Directory
    curr.directories.splice(curr.directories.indexOf(item), 1);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < node.directories.length; j++) {
        if (node.directories[j].name === nodes[i]) {
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
        if (node.directories[j].name === nodes[i]) {
          node = node.directories[j];
          break;
        }
      }
    }
    node.notes.push(item);
  }
}

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

export {
  createFileWindow,
  FileSystemNode,
  Note,
  type noteData,
  evaluateFSPathName,
  isValidFSPath,
  moveFSItem,
  download,
};
