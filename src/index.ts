import drawing from "./canvas";

const mainCanvas = new drawing(window.innerWidth - 25, window.innerHeight - 25);

function render() {
  const element = document.createElement("div");
  element.appendChild(mainCanvas.element);

  return element;
}

document.body.appendChild(render());
