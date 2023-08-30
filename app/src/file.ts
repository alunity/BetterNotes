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

export { createFileWindow };
