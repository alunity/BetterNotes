import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./SvgPathFromStroke";
import "./canvas.css";

const penOptions = {
  size: 10,
  smoothing: 0.48,
  thinning: 0,
  streamline: 0.23,
  easing: (t: number) => Math.sin((t * Math.PI) / 2),
  start: {
    taper: 0,
    cap: true,
  },
  end: {
    taper: 0,
    cap: true,
  },
};

// Top left
// [[-this.xScroll, -this.yScroll]]

// Top right
//   [(this.canvasElement.width * 1) / this.zoomFactor - this.xScroll,-this.yScroll,]

// Bottom left
// [-this.xScroll,(this.canvasElement.height * 1) / this.zoomFactor - this.yScroll,]

// Bottom right
// [(this.canvasElement.width * 1) / this.zoomFactor - this.xScroll,(this.canvasElement.height * 1) / this.zoomFactor - this.yScroll,],

interface iListeners {
  [name: string]: any;
}

class canvas {
  canvasElement: HTMLCanvasElement = undefined;

  strokes: Array<Array<Array<number>>> = [];
  canDraw = true;
  drawing = false;
  points: Array<Array<number>> = [];

  xScroll = 0;
  yScroll = 0;
  zoomFactor = 1;

  ZOOM_MULT = 1.25;
  SCROLL = 20;

  backgrounds: Array<HTMLImageElement> = [];

  listeners: iListeners = {};

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
    if (e.buttons == 1 && this.canDraw) {
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

    this.render();
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
    this.render();
  }

  canvasZoom(factor: number) {
    const context = this.canvasElement.getContext("2d");
    this.zoomFactor *= factor;

    context.resetTransform();

    context.scale(this.zoomFactor, this.zoomFactor);
    context.translate(this.xScroll, this.yScroll);
    this.render();
  }

  renderStrokes(strokes: Array<Array<Array<number>>>) {
    const context = this.canvasElement.getContext("2d");
    for (let i = 0; i < strokes.length; i++) {
      const stroke = getStroke(strokes[i], penOptions);
      const pathData = getSvgPathFromStroke(stroke);

      let path = new Path2D(pathData);
      context.fill(path);
    }
  }

  renderBackground() {
    let context = this.canvasElement.getContext("2d");
    let currY = 0;

    const TOP_LEFT = [-this.xScroll, -this.yScroll];
    const BOTTOM_RIGHT = [
      (this.canvasElement.width * 1) / this.zoomFactor - this.xScroll,
      (this.canvasElement.height * 1) / this.zoomFactor - this.yScroll,
    ];

    let rendered = 0;

    for (let i = 0; i < this.backgrounds.length; i++) {
      if (
        BOTTOM_RIGHT[0] > 0 &&
        BOTTOM_RIGHT[1] > currY &&
        TOP_LEFT[0] < this.backgrounds[i].width &&
        TOP_LEFT[1] < currY + this.backgrounds[i].height
      ) {
        context.drawImage(this.backgrounds[i], 0, currY);
        rendered++;
      }
      currY += this.backgrounds[i].height;
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

  async render() {
    this.clearCanvas();

    this.renderBackground();

    // Find strokes in view
    const strokesToRender = [];
    const TOP_LEFT = [-this.xScroll, -this.yScroll];
    const BOTTOM_RIGHT = [
      (this.canvasElement.width * 1) / this.zoomFactor - this.xScroll,
      (this.canvasElement.height * 1) / this.zoomFactor - this.yScroll,
    ];
    for (let i = 0; i < this.strokes.length; i++) {
      for (let j = 0; j < this.strokes[i].length; j++) {
        if (
          this.strokes[i][j][0] > TOP_LEFT[0] &&
          this.strokes[i][j][1] > TOP_LEFT[1] &&
          this.strokes[i][j][0] < BOTTOM_RIGHT[0] &&
          this.strokes[i][j][1] < BOTTOM_RIGHT[1]
        ) {
          strokesToRender.push(this.strokes[i]);
          break;
        }
      }
    }
    this.renderStrokes(strokesToRender);
    if (this.drawing) this.renderStrokes([this.points]);
  }

  resizeCanvas(width: number, height: number) {
    this.canvasElement.height = height;
    this.canvasElement.width = width;
  }

  constructor(width: number, height: number) {
    const canvas = document.createElement("canvas");
    this.canvasElement = canvas;

    this.resizeCanvas(width, height);
  }

  bindListeners() {
    this.listeners["mousemove"] = this.handleMouseMove.bind(this);
    this.listeners["mousedown"] = this.handleMouseDown.bind(this);
    this.listeners["mouseup"] = this.handleMouseUp.bind(this);
    this.listeners["wheel"] = this.handleScrollWheel.bind(this);

    console.log(this.listeners);

    this.canvasElement.addEventListener(
      "mousemove",
      this.listeners["mousemove"]
    );
    this.canvasElement.addEventListener(
      "mousedown",
      this.listeners["mousedown"]
    );
    this.canvasElement.addEventListener("mouseup", this.listeners["mouseup"]);
    this.canvasElement.addEventListener("wheel", this.listeners["wheel"]);
  }

  removeListener() {
    this.canvasElement.removeEventListener(
      "mousemove",

      this.listeners["mousemove"]
    );
    this.canvasElement.removeEventListener(
      "mousedown",

      this.listeners["mousedown"]
    );
    this.canvasElement.removeEventListener(
      "mouseup",
      this.listeners["mouseup"]
    );
    this.canvasElement.removeEventListener("wheel", this.listeners["wheel"]);
  }

  get element() {
    return this.canvasElement;
  }

  set allowedToDraw(value: boolean) {
    this.canDraw = value;
  }

  set background(x: Array<string>) {
    for (let i = 0; i < x.length; i++) {
      let img = new Image();
      img.src = x[i];
      this.backgrounds.push(img);
    }

    // Ensures that render executes after background is set
    // I really need to figure out async :(
    setTimeout(() => {
      this.render();
      this.bindListeners();
    }, 1);
  }
}

export default canvas;
