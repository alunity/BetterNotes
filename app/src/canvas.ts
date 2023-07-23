import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./SvgPathFromStroke";

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

function pytag(x_1: number, y_1: number, x_2: number, y_2: number) {
  const dx = x_2 - x_1;
  const dy = y_2 - y_1;
  return Math.sqrt(dx * dx + dy * dy);
}

class canvas {
  canvasElement: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  strokes: Array<Array<Array<number>>> = [];
  canDraw = true;
  drawing = false;
  points: Array<Array<number>> = [];

  xScroll = 0;
  yScroll = 0;
  zoomFactor = 1;

  ZOOM_MULT = 1.1;
  SCROLL = 50;

  SCROLL_DECEL = 0.8;

  INTERPOLATE_DIST = 10;
  linearInterpolation = true;

  backgrounds: Array<HTMLImageElement> = [];

  listeners: iListeners = {};

  debug = false;

  handleScrollWheel(e: WheelEvent) {
    if (e.deltaY > 0) {
      // Right, Zoom out, down
      if (e.shiftKey) {
        this.smoothScroll(performance.now(), -this.SCROLL, 0);
      } else if (e.ctrlKey) {
        // Zoom out

        // this.canvasZoom(1 / this.ZOOM_MULT);
        this.smoothZoom(performance.now(), 1 / this.ZOOM_MULT);
      } else {
        this.smoothScroll(performance.now(), 0, -this.SCROLL);
      }
    } else if (e.deltaY < 0) {
      // Left, Zoom in, up
      if (e.shiftKey) {
        this.smoothScroll(performance.now(), this.SCROLL, 0);
      } else if (e.ctrlKey) {
        this.smoothZoom(performance.now(), this.ZOOM_MULT);
      } else {
        this.smoothScroll(performance.now(), 0, this.SCROLL);
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

  handlePointerUp() {
    this.drawing = false;
    this.strokes.push(this.points);

    this.points = [];

    this.render();
  }

  handlePointerMove(e: PointerEvent) {
    if (this.drawing && this.pageCursorIsOn(e) !== -1) {
      let rect = (e.target as HTMLElement).getBoundingClientRect();

      const dist = pytag(
        (e.clientX - rect.left) / this.zoomFactor - this.xScroll,
        (e.clientY - rect.top) / this.zoomFactor - this.yScroll,
        this.points[this.points.length - 1][0],
        this.points[this.points.length - 1][1]
      );

      // Interpolation
      if (
        dist > this.INTERPOLATE_DIST / this.zoomFactor &&
        this.linearInterpolation
      ) {
        const dx =
          (e.clientX - rect.left) / this.zoomFactor -
          this.xScroll -
          this.points[this.points.length - 1][0];

        const dy =
          (e.clientY - rect.top) / this.zoomFactor -
          this.yScroll -
          this.points[this.points.length - 1][1];

        for (let i = 0; i < Math.floor(dist / this.INTERPOLATE_DIST); i++) {
          this.points.push([
            this.points[this.points.length - 1][0] +
              dx / Math.floor(dist / this.INTERPOLATE_DIST),
            this.points[this.points.length - 1][1] +
              dy / Math.floor(dist / this.INTERPOLATE_DIST),
          ]);
        }
      }

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

  smoothScroll(
    x: DOMHighResTimeStamp,
    distX: number,
    distY: number,
    conv = false
  ) {
    if (!conv) {
      // Adjusts params so that the total distance traveled is equal to the values given
      // Geometric sequence

      distY = (distY * (1 - this.SCROLL_DECEL)) / this.SCROLL_DECEL;
      distX = (distX * (1 - this.SCROLL_DECEL)) / this.SCROLL_DECEL;
    }

    this.canvasScroll(distX, distY);
    distY *= this.SCROLL_DECEL;
    distX *= this.SCROLL_DECEL;

    if (Math.abs(distY) < 0.001 && Math.abs(distX) < 0.001) {
      return;
    }

    requestAnimationFrame(this.smoothScroll.bind(this, x, distX, distY, true));
  }

  smoothZoom(x: DOMHighResTimeStamp, vel: number, conv = false) {
    const lb = 0.99;
    const ub = 1.01;

    const decel = 0.99;

    if (!conv) {
      let bound = 1;
      if (vel > 1) {
        bound = 1.1;
      } else if (vel < 1) {
        bound = 0.9;
      }
      console.log(
        Math.floor(Math.abs(Math.log(bound / vel) / Math.log(decel)))
      );
    }

    this.canvasZoom(vel);

    if (vel > 1) {
      vel *= decel;
    } else if (vel < 1) {
      vel /= decel;
    }

    if (vel > lb && vel < ub) {
      return;
    }

    requestAnimationFrame(this.smoothZoom.bind(this, x, vel, true));
  }

  canvasScroll(x: number, y: number) {
    this.xScroll += x / this.zoomFactor;
    this.yScroll += y / this.zoomFactor;

    this.context.translate(x / this.zoomFactor, y / this.zoomFactor);
    this.render();
  }

  canvasZoom(
    factor: number,
    x = this.canvasElement.width / 2,
    y = this.canvasElement.height / 2
  ) {
    this.canvasScroll(-x, -y);
    this.zoomFactor *= factor;

    this.context.resetTransform();

    this.context.scale(this.zoomFactor, this.zoomFactor);
    this.context.translate(this.xScroll, this.yScroll);
    this.render();
    this.canvasScroll(x, y);
  }

  renderStrokes(strokes: Array<Array<Array<number>>>) {
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
      // const stroke = strokesToRender[i]
      const pathData = getSvgPathFromStroke(stroke);

      this.context.fillStyle = "#000000";
      const path = new Path2D(pathData);
      this.context.fill(path);

      if (this.debug) {
        for (let j = 0; j < strokesToRender[i].length; j++) {
          const stroke = getStroke([strokesToRender[i][j]], { ...penOptions });
          const pathData = getSvgPathFromStroke(stroke);
          const path = new Path2D(pathData);

          this.context.fillStyle = "#FF0000";

          this.context.fill(path);
        }
      }
    }
  }

  renderBackground() {
    let currY = 0;

    const TOP_LEFT = [-this.xScroll, -this.yScroll];
    const BOTTOM_RIGHT = [
      (this.canvasElement.width * 1) / this.zoomFactor - this.xScroll,
      (this.canvasElement.height * 1) / this.zoomFactor - this.yScroll,
    ];

    // Render Backdrop
    this.context.fillStyle = "#333333";
    this.context.fillRect(
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
        this.context.drawImage(this.backgrounds[i], 0, currY);
        this.context.strokeRect(
          0,
          currY,
          this.backgrounds[i].width,
          this.backgrounds[i].height
        );
      }
      currY += this.backgrounds[i].height;
    }
  }

  render() {
    this.clearCanvas();

    this.renderBackground();

    this.renderStrokes(this.strokes);
    if (this.drawing) this.renderStrokes([this.points]);
  }

  clearCanvas() {
    this.context.beginPath();

    // Store the current transformation matrix
    this.context.save();

    // Use the identity matrix while clearing the canvas
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(
      0,
      0,
      this.canvasElement.width,
      this.canvasElement.height
    );

    // Restore the transform
    this.context.restore();
  }

  resizeCanvas(width: number, height: number) {
    this.canvasElement.height = height;
    this.canvasElement.width = width;
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
      const img = new Image();
      img.src = x[i];
      this.backgrounds.push(img);
    }

    setTimeout(() => {
      this.render();
      this.bindListeners();
    }, 1);
  }

  constructor(width: number, height: number) {
    const canvas = document.createElement("canvas");
    this.canvasElement = canvas;
    const ctx = canvas.getContext("2d");
    if (ctx !== null) {
      this.context = ctx;
    } else {
      throw new Error("Cannot get canvas context");
    }

    this.resizeCanvas(width, height);
  }
}

export default canvas;
