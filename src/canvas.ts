import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./SvgPathFromStroke";
import "./canvas.css";

let globalCanvas: HTMLCanvasElement = undefined;

let strokes: Array<Array<Array<number>>> = [];
let points: Array<Array<number>> = [];
let drawing = false;

let xScroll = 0;
let yScroll = 0;
let zoomFactor = 1;

function handleScrollWheel(e: WheelEvent) {
  console.table({
    x: xScroll,
    y: yScroll,
    zoom: zoomFactor,
    mouseX: e.clientX,
    mouseY: e.clientY,
  });
  if (e.deltaY > 0) {
    // Right, Zoom out, down
    if (e.shiftKey) {
      canvasScroll(globalCanvas, -10, 0);
    } else if (e.ctrlKey) {
      // Zoom out
      canvasZoom(globalCanvas, 2 / 3);
    } else {
      canvasScroll(globalCanvas, 0, -10);
    }
  } else if (e.deltaY < 0) {
    // Left, Zoom in, up
    if (e.shiftKey) {
      canvasScroll(globalCanvas, 10, 0);
    } else if (e.ctrlKey) {
      canvasZoom(globalCanvas, 1.5);
    } else {
      canvasScroll(globalCanvas, 0, 10);
    }
  }
  e.preventDefault();
}

function handleMouseDown(e: MouseEvent) {
  drawing = true;
  let rect = (e.target as HTMLElement).getBoundingClientRect();
  points.push([
    (e.clientX - rect.left) / zoomFactor - xScroll,
    (e.clientY - rect.top) / zoomFactor - yScroll,
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
      (e.clientX - rect.left) / zoomFactor - xScroll,
      (e.clientY - rect.top) / zoomFactor - yScroll,
    ]);

    // Only render then new line being drawn
    renderStrokes(globalCanvas, [points]);
  }
}

function canvasScroll(canvas: HTMLCanvasElement, x: number, y: number) {
  const context = canvas.getContext("2d");
  xScroll += x / zoomFactor;
  yScroll += y / zoomFactor;

  context.translate(x / zoomFactor, y / zoomFactor);
  clearCanvas(canvas);
  renderStrokes(canvas, strokes);
}

function canvasZoom(canvas: HTMLCanvasElement, factor: number) {
  const context = canvas.getContext("2d");
  zoomFactor *= factor;

  context.resetTransform();

  context.scale(zoomFactor, zoomFactor);
  context.translate(xScroll, yScroll);
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
