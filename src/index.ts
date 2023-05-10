function component() {
  const element = document.createElement("div");

  element.innerHTML = "Hello world from TypeScript";

  return element;
}

document.body.appendChild(component());
