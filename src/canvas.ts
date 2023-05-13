import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./SvgPathFromStroke";
import "./canvas.css";

class canvas {
  canvasElement: HTMLCanvasElement = undefined;

  strokes: Array<Array<Array<number>>> = [];
  drawing = false;
  points: Array<Array<number>> = [];

  xScroll = 0;
  yScroll = 0;
  zoomFactor = 1;

  ZOOM_MULT = 1.25;
  SCROLL = 20;

  handleScrollWheel(e: WheelEvent) {
    if (e.deltaY > 0) {
      // Right, Zoom out, down
      if (e.shiftKey) {
        this.canvasScroll(-this.SCROLL, 0);
      } else if (e.ctrlKey) {
        // Zoom out
        this.canvasScroll(
          -this.canvasElement.width / 2,
          -this.canvasElement.height / 2
        );
        this.canvasZoom(1 / this.ZOOM_MULT);
        this.canvasScroll(
          this.canvasElement.width / 2,
          this.canvasElement.height / 2
        );
      } else {
        this.canvasScroll(0, -this.SCROLL);
      }
    } else if (e.deltaY < 0) {
      // Left, Zoom in, up
      if (e.shiftKey) {
        this.canvasScroll(this.SCROLL, 0);
      } else if (e.ctrlKey) {
        // canvasScroll(globalCanvas, -e.clientX, -e.clientY);
        this.canvasScroll(
          -this.canvasElement.width / 2,
          -this.canvasElement.height / 2
        );
        this.canvasZoom(this.ZOOM_MULT);
        this.canvasScroll(
          this.canvasElement.width / 2,
          this.canvasElement.height / 2
        );
      } else {
        this.canvasScroll(0, this.SCROLL);
      }
    }
    e.preventDefault();
  }

  handleMouseDown(e: MouseEvent) {
    if (e.buttons == 1) {
      this.drawing = true;
      let rect = (e.target as HTMLElement).getBoundingClientRect();
      this.points.push([
        (e.clientX - rect.left) / this.zoomFactor - this.xScroll,
        (e.clientY - rect.top) / this.zoomFactor - this.yScroll,
      ]);
      this.renderStrokes([this.points]);
    }
  }

  handleMouseUp() {
    this.drawing = false;
    this.strokes.push(this.points);
    this.points = [];

    this.clearCanvas();
    this.renderStrokes(this.strokes);
  }

  handleMouseMove(e: MouseEvent) {
    if (this.drawing) {
      let rect = (e.target as HTMLElement).getBoundingClientRect();
      this.points.push([
        (e.clientX - rect.left) / this.zoomFactor - this.xScroll,
        (e.clientY - rect.top) / this.zoomFactor - this.yScroll,
      ]);

      // Only render then new line being drawn
      this.renderStrokes([this.points]);
    }
  }

  canvasScroll(x: number, y: number) {
    const context = this.canvasElement.getContext("2d");
    this.xScroll += x / this.zoomFactor;
    this.yScroll += y / this.zoomFactor;

    context.translate(x / this.zoomFactor, y / this.zoomFactor);
    this.clearCanvas();
    this.renderStrokes(this.strokes);
  }

  canvasZoom(factor: number) {
    const context = this.canvasElement.getContext("2d");
    this.zoomFactor *= factor;

    context.resetTransform();

    context.scale(this.zoomFactor, this.zoomFactor);
    context.translate(this.xScroll, this.yScroll);
    this.clearCanvas();
    this.renderStrokes(this.strokes);
  }

  renderStrokes(strokes: Array<Array<Array<number>>>) {
    const context = this.canvasElement.getContext("2d");

    let stroke = getStroke(this.points);
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

  clearCanvas() {
    const context = this.canvasElement.getContext("2d");

    context.beginPath();

    // Store the current transformation matrix
    context.save();

    // Use the identity matrix while clearing the canvas
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(
      0,
      0,
      this.canvasElement.width,
      this.canvasElement.height
    );

    // Restore the transform
    context.restore();
  }

  resizeCanvas(width: number, height: number) {
    this.canvasElement.height = height;
    this.canvasElement.width = width;
  }

  constructor(width: number, height: number) {
    const canvas = document.createElement("canvas");
    this.canvasElement = canvas;

    this.resizeCanvas(width, height);

    canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    canvas.addEventListener("wheel", this.handleScrollWheel.bind(this));
  }

  get element() {
    return this.canvasElement;
  }
}

export default canvas;
