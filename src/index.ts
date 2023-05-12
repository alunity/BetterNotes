import createCanvas from "./canvas";

function render() {
  const element = document.createElement("div");

  element.appendChild(
    createCanvas(window.innerWidth - 25, window.innerHeight - 25)
  );

  return element;
}

document.body.appendChild(render());
