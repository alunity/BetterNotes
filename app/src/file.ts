interface noteData {
  strokes: Array<Array<Array<number>>>;
  backgrounds: Array<string>;
}

class Note {
  name: string;
  data: noteData;

  constructor(name: string, saveData?: noteData) {
    this.name = name;
    if (saveData) {
      this.data = saveData;
    } else {
      this.data = { strokes: [[[]]], backgrounds: [] };
    }
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
}

function evaluateFSPathName(node: FileSystemNode) {
  const names = [];
  while (node.root) {
    names.unshift(node.name);
    node = node.root;
  }
  return names.join("/");
}

function isValidFSPath(node: FileSystemNode, path: string) {
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

const inp = document.createElement("input");
inp.type = "file";

inp.addEventListener("change", async () => {
  if (inp.files === null) {
    return;
  }
  const file = inp.files[0];

  if (file) {
    console.log(await file.text());
  }
});

function createFileWindow() {
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
};
