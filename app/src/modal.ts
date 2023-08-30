import { Modal } from "bootstrap";
import downloadPDF from "./pdf";

const templates = [
  "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Grid/Grid-5mm-Portrait-Dark.pdf",
  "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Plain/Portrait-Dark.pdf",
  "https://raw.githubusercontent.com/flyguybravo/goodnotes/1f93ef6/Dark/Lined-College/Lined-Ruled-Portrait-Dark.pdf",
];

async function createNoteModal() {
  const modalElement = document.getElementById("createNoteModal");
  const templateElement = document.getElementById("templates");
  const templateLoading = document.getElementById("templateImageLoading");
  if (
    modalElement !== null &&
    templateElement !== null &&
    templateLoading !== null
  ) {
    templateLoading.classList.remove("hide");
    templateElement.classList.add("hide");

    const modal = new Modal(modalElement);
    modal.show();

    templateElement.innerHTML = "";

    for (let i = 0; i < templates.length; i++) {
      const img = new Image();
      img.src = (await downloadPDF(templates[i]))[0];
      img.width = 200;
      img.height = 200;
      img.classList.add("p-3");
      templateElement.appendChild(img);
    }

    templateLoading.classList.add("hide");
    templateElement.classList.remove("hide");
  }
}

export { createNoteModal };
