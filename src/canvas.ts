import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./SvgPathFromStroke";
import "./canvas.css";

let globalCanvas: HTMLCanvasElement = undefined;

let strokes: Array<Array<Array<number>>> = [];
let points: Array<Array<number>> = [];
let drawing = false;

let xScroll = 0;
let yScroll = 0;

function handleScrollWheel(e: WheelEvent) {
  if (e.deltaY > 0) {
    canvasScroll(globalCanvas, 0, -10);
  } else if (e.deltaY < 0) {
    canvasScroll(globalCanvas, 0, 10);
  }
}

function handleMouseDown(e: MouseEvent) {
  drawing = true;
  let rect = (e.target as HTMLElement).getBoundingClientRect();
  points.push([
    e.clientX - rect.left - xScroll,
    e.clientY - rect.top - yScroll,
  ]);
  renderStrokes(globalCanvas, [points]);
}

function handleMouseUp() {
  drawing = false;
  strokes.push(points);
  points = [];

  clearCanvas(globalCanvas);
  renderStrokes(globalCanvas, strokes);
}

function handleMouseMove(e: MouseEvent) {
  if (drawing) {
    let rect = (e.target as HTMLElement).getBoundingClientRect();
    points.push([
      e.clientX - rect.left - xScroll,
      e.clientY - rect.top - yScroll,
    ]);

    // Only render then new line being drawn
    renderStrokes(globalCanvas, [points]);
  }
}

function canvasScroll(canvas: HTMLCanvasElement, x: number, y: number) {
  const context = canvas.getContext("2d");
  xScroll += x;
  yScroll += y;

  context.translate(x, y);
  clearCanvas(canvas);
  renderStrokes(canvas, strokes);
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

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("wheel", handleScrollWheel);

  return canvas;
}

export default createCanvas;
