import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./SvgPathFromStroke";
import recogniseCharacter from "./character_recognition/characterRecognition";

const penOptions = {
  size: 5,
  smoothing: 0.48,
  thinning: 0.5,
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
  simulatePressure: false,
};

// const penOptions = {
//   size: 16,
//   smoothing: 0.5,
//   thinning: 0.5,
//   streamline: 0.5,
//   easing: (t: number) => t,
//   start: {
//     taper: 0,
//     cap: true,
//   },
//   end: {
//     taper: 0,
//     cap: true,
//   },
//   simulatePressure: false
// }

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

  handlePointerDown(e: PointerEvent) {
    if (e.buttons == 1 && this.canDraw && this.pageCursorIsOn(e) !== -1) {
      this.drawing = true;
      let rect = (e.target as HTMLElement).getBoundingClientRect();
      this.points.push([
        (e.clientX - rect.left) / this.zoomFactor - this.xScroll,
        (e.clientY - rect.top) / this.zoomFactor - this.yScroll,
        e.pressure,
      ]);
      this.renderStrokes([this.points]);
    }
  }

  pageCursorIsOn(e: MouseEvent) {
    const TOP_LEFT = [-this.xScroll, -this.yScroll];
    const POS = [
      TOP_LEFT[0] + e.clientX / this.zoomFactor,
      TOP_LEFT[1] + e.clientY / this.zoomFactor,
    ];
    let currY = 0;

    for (let i = 0; i < this.backgrounds.length; i++) {
      if (
        POS[0] > 0 &&
        POS[1] > currY &&
        POS[0] < this.backgrounds[i].width &&
        POS[1] < currY + this.backgrounds[i].height
      ) {
        return i + 1;
      }
      currY += this.backgrounds[i].height;
    }
    return -1;
  }

  handlePointerUp() {
    this.drawing = false;
    this.strokes.push(this.points);

    recogniseCharacter(this.points);

    this.points = [];

    window.requestAnimationFrame(this.render.bind(this));
  }

  handlePointerMove(e: PointerEvent) {
    if (this.drawing && this.pageCursorIsOn(e) !== -1) {
      let rect = (e.target as HTMLElement).getBoundingClientRect();
      this.points.push([
        (e.clientX - rect.left) / this.zoomFactor - this.xScroll,
        (e.clientY - rect.top) / this.zoomFactor - this.yScroll,
        e.pressure,
      ]);

      if (!(this.points.length % 10)) {
        this.render();
      }
      // Only render then new line being drawn
      this.renderStrokes([this.points]);
    }
  }

  canvasScroll(x: number, y: number) {
    const context = this.canvasElement.getContext("2d");
    this.xScroll += x / this.zoomFactor;
    this.yScroll += y / this.zoomFactor;

    context.translate(x / this.zoomFactor, y / this.zoomFactor);
    // this.render();
    window.requestAnimationFrame(this.render.bind(this));
  }

  canvasZoom(factor: number) {
    const context = this.canvasElement.getContext("2d");
    this.zoomFactor *= factor;

    context.resetTransform();

    context.scale(this.zoomFactor, this.zoomFactor);
    context.translate(this.xScroll, this.yScroll);
    window.requestAnimationFrame(this.render.bind(this));
    // this.render();
  }

  renderStrokes(strokes: Array<Array<Array<number>>>) {
    const context = this.canvasElement.getContext("2d");
    // Find strokes in view
    const strokesToRender = [];
    const TOP_LEFT = [-this.xScroll, -this.yScroll];
    const BOTTOM_RIGHT = [
      (this.canvasElement.width * 1) / this.zoomFactor - this.xScroll,
      (this.canvasElement.height * 1) / this.zoomFactor - this.yScroll,
    ];
    for (let i = 0; i < strokes.length; i++) {
      for (let j = 0; j < strokes[i].length; j++) {
        if (
          strokes[i][j][0] > TOP_LEFT[0] &&
          strokes[i][j][1] > TOP_LEFT[1] &&
          strokes[i][j][0] < BOTTOM_RIGHT[0] &&
          strokes[i][j][1] < BOTTOM_RIGHT[1]
        ) {
          strokesToRender.push(strokes[i]);
          break;
        }
      }
    }

    for (let i = 0; i < strokesToRender.length; i++) {
      const stroke = getStroke(strokesToRender[i], penOptions);
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

    // Render Backdrop
    this.canvasElement.getContext("2d").fillStyle = "#333333";
    this.canvasElement
      .getContext("2d")
      .fillRect(
        TOP_LEFT[0],
        TOP_LEFT[1],
        BOTTOM_RIGHT[0] - TOP_LEFT[0],
        BOTTOM_RIGHT[1] - TOP_LEFT[1]
      );

    // Render PDF
    for (let i = 0; i < this.backgrounds.length; i++) {
      if (
        BOTTOM_RIGHT[0] > 0 &&
        BOTTOM_RIGHT[1] > currY &&
        TOP_LEFT[0] < this.backgrounds[i].width &&
        TOP_LEFT[1] < currY + this.backgrounds[i].height
      ) {
        context.drawImage(this.backgrounds[i], 0, currY);
        context.strokeRect(
          0,
          currY,
          this.backgrounds[i].width,
          this.backgrounds[i].height
        );
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

  render() {
    this.clearCanvas();

    this.renderBackground();

    this.renderStrokes(this.strokes);
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
    this.listeners["mousemove"] = this.handlePointerMove.bind(this);
    this.listeners["mousedown"] = this.handlePointerDown.bind(this);
    this.listeners["mouseup"] = this.handlePointerUp.bind(this);
    this.listeners["wheel"] = this.handleScrollWheel.bind(this);

    this.canvasElement.addEventListener(
      "pointermove",
      this.listeners["mousemove"]
    );
    this.canvasElement.addEventListener(
      "pointerdown",
      this.listeners["mousedown"]
    );
    this.canvasElement.addEventListener("pointerup", this.listeners["mouseup"]);
    this.canvasElement.addEventListener("wheel", this.listeners["wheel"]);
  }

  removeListener() {
    this.canvasElement.removeEventListener(
      "pointermove",

      this.listeners["mousemove"]
    );
    this.canvasElement.removeEventListener(
      "pointerdown",

      this.listeners["mousedown"]
    );
    this.canvasElement.removeEventListener(
      "pointerup",
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
