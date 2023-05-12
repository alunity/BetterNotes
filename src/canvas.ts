import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./SvgPathFromStroke";
import "./canvas.css";

let globalCanvas: HTMLCanvasElement = undefined;

let strokes: Array<Array<Array<number>>> = [];
let points: Array<Array<number>> = [];
let drawing = false;

function handleMouseMove(e: MouseEvent) {
  if (drawing) {
    let rect = (e.target as HTMLElement).getBoundingClientRect();
    points.push([e.clientX - rect.left, e.clientY - rect.top]);

    // Only render then new line being drawn
    renderStrokes(globalCanvas, [points]);
  }
}

function renderStrokes(
  canvas: HTMLCanvasElement,
  strokes: Array<Array<Array<number>>>
) {
  const context = canvas.getContext("2d");

  let stroke = getStroke(points);
  let pathData = getSvgPathFromStroke(stroke);
  let path = new Path2D(pathData);
  context.fill(path);

  for (let i = 0; i < strokes.length; i++) {
    stroke = getStroke(strokes[i]);
    pathData = getSvgPathFromStroke(stroke);

    let path = new Path2D(pathData);
    context.fill(path);
  }
}

function clearCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");

  context.beginPath();

  // Store the current transformation matrix
  context.save();

  // Use the identity matrix while clearing the canvas
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Restore the transform
  context.restore();
}

function handleMouseDown(e: MouseEvent) {
  drawing = true;
  let rect = (e.target as HTMLElement).getBoundingClientRect();
  points.push([e.clientX - rect.left, e.clientY - rect.top]);
  renderStrokes(globalCanvas, [points]);
}

function handleMouseUp() {
  drawing = false;
  strokes.push(points);
  points = [];

  clearCanvas(globalCanvas);
  renderStrokes(globalCanvas, strokes);
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  canvas.height = height;
  canvas.width = width;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  globalCanvas = canvas;

  resizeCanvas(canvas, width, height);

  // if (canvas.getContext) {
  // const ctx = canvas.getContext("2d");
  // }
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);

  return canvas;
}

export default createCanvas;
