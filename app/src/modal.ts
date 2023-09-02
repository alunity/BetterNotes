import { Modal } from "bootstrap";
import downloadPDF from "./pdf";

const templates = [
  [
    "Dark Grid",
    "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Grid/Grid-5mm-Portrait-Dark.pdf",
  ],
  [
    "Dark plain",
    "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Plain/Portrait-Dark.pdf",
  ],
  [
    "Dark lined",
    "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Lined-College/Lined-Ruled-Portrait-Dark.pdf",
  ],
];

async function getNoteModal() {
  const modalElement = document.getElementById("createNoteModal");
  if (modalElement) {
    return await new Modal(modalElement);
  }
}

async function createNoteModal(
  createNote: (name: string, template: string) => void,
  createDirectory: (name: string) => void
) {
  const modalElement = document.getElementById("createNoteModal");
  const templateElement = document.getElementById("templates");
  const templateLoading = document.getElementById("templateImageLoading");
  const templateDiv = document.getElementById("templateDiv");

  const noteBTN = document.getElementById("selectNote");
  const directoryBTN = document.getElementById("selectDirectory");

  const nameInput = document.getElementById("nameInput") as HTMLInputElement;
  const createBTN = document.getElementById("createBTN");

  if (
    modalElement &&
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
      if (target.value.length === 0) {
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

export { createNoteModal, getNoteModal };
