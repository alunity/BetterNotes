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

  get isRoot() {
    return this.root === null;
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

export { createFileWindow, FileSystemNode, Note, type noteData };
