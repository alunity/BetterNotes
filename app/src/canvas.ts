import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./SvgPathFromStroke";
import "./canvas.css";

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

// Center
//   [(this.canvasElement.width  / this.zoomFactor)/2 - (this.xScroll), (this.canvasElement.height  / this.zoomFactor)/2 - (this.yScroll)]

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

interface iStrokes {
  points: Array<Array<number>>;
  path: Path2D;
}

class canvas {
  canvasElement: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  strokes: Array<iStrokes> = [];
  canDraw = false;
  erasing = false;
  drawing = false;
  points: Array<Array<number>> = [];

  xScroll = 0;
  yScroll = 0;
  SCROLL_DECEL = 0.8;
  SCROLL = 50;

  zoomFactor = 1;
  ZOOM_MULT = 1.1;
  ZOOM_MIN = 0.5;
  ZOOM_MAX = 10;

  SMOOTH = true;

  INTERPOLATE_DIST = 10;
  linearInterpolation = true;

  treatTouchAsStylus = false;

  backgrounds: Array<HTMLImageElement> = [];

  listeners: iListeners = {};

  debug = false;

  handleScrollWheel(e: WheelEvent) {
    if (e.deltaY > 0) {
      // Right, Zoom out, down
      if (e.shiftKey) {
        this.scroll(-this.SCROLL, 0);
      } else if (e.ctrlKey) {
        // Zoom out
        this.zoom(1 / this.ZOOM_MULT, e.clientX, e.clientY);
      } else {
        this.scroll(0, -this.SCROLL);
      }
    } else if (e.deltaY < 0) {
      // Left, Zoom in, up
      if (e.shiftKey) {
        this.scroll(this.SCROLL, 0);
      } else if (e.ctrlKey) {
        this.zoom(this.ZOOM_MULT, e.clientX, e.clientY);
      } else {
        this.scroll(0, this.SCROLL);
      }
    }

    e.preventDefault();
  }

  handleMouseDown(e: MouseEvent) {
    if (e.buttons == 1 && this.pageCursorIsOn(e) !== -1) {
      let rect = (e.target as HTMLElement).getBoundingClientRect();
      if (this.canDraw) {
        this.drawing = true;
        this.handleDrawStart(e.clientX - rect.left, e.clientY - rect.top, 0.5);
      } else if (this.erasing) {
        this.handleErase(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  }

  handleMouseUp() {
    this.handleDrawEnd();
  }

  handleMouseMove(e: MouseEvent) {
    if (this.pageCursorIsOn(e) === -1) {
      this.handleMouseUp();
      return;
    }
    if (e.buttons == 1) {
      let rect = (e.target as HTMLElement).getBoundingClientRect();
      if (this.drawing) {
        this.handleDraw(e.clientX - rect.left, e.clientY - rect.top, 0.5);
      } else if (this.erasing) {
        this.handleErase(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  }

  handleDrawStart(x: number, y: number, pressure: number) {
    this.points.push([
      x / this.zoomFactor - this.xScroll,
      y / this.zoomFactor - this.yScroll,
      pressure,
    ]);
    this.renderStrokes([
      {
        points: this.points,
        path: new Path2D(
          getSvgPathFromStroke(getStroke(this.points, penOptions))
        ),
      },
    ]);
  }

  handleDraw(x: number, y: number, pressure: number) {
    const dist = pytag(
      x / this.zoomFactor - this.xScroll,
      y / this.zoomFactor - this.yScroll,
      this.points[this.points.length - 1][0],
      this.points[this.points.length - 1][1]
    );

    // Interpolation
    if (
      dist > this.INTERPOLATE_DIST / this.zoomFactor &&
      this.linearInterpolation
    ) {
      const dx =
        x / this.zoomFactor -
        this.xScroll -
        this.points[this.points.length - 1][0];

      const dy =
        y / this.zoomFactor -
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
      x / this.zoomFactor - this.xScroll,
      y / this.zoomFactor - this.yScroll,
      pressure,
    ]);

    if (!(this.points.length % 10)) {
      this.render();
    }
    // Only render then new line being drawn
    this.renderStrokes([
      {
        points: this.points,
        path: new Path2D(
          getSvgPathFromStroke(getStroke(this.points, penOptions))
        ),
      },
    ]);
  }

  handleDrawEnd() {
    this.drawing = false;
    this.strokes.push({
      points: this.points,
      path: new Path2D(
        getSvgPathFromStroke(getStroke(this.points, penOptions))
      ),
    });

    this.points = [];

    this.render();
  }

  handleErase(x: number, y: number) {
    let erased = false;
    for (let i = 0; i < this.strokes.length; i++) {
      for (let j = 0; j < this.strokes[i].points.length; j++) {
        if (
          pytag(
            x / this.zoomFactor - this.xScroll,
            y / this.zoomFactor - this.yScroll,
            this.strokes[i].points[j][0],
            this.strokes[i].points[j][1]
          ) <= 10
        ) {
          this.strokes.splice(i, 1);
          erased = true;
          break;
        }
      }
    }

    if (erased) {
      this.render();
    }
  }

  lastTouchPosition: Array<number> = [];
  lastDist = 0;

  handleTouchStart(e: TouchEvent) {
    console.log(e);
    e.preventDefault();

    // Check for apple pencil

    if (
      // @ts-ignore Ignore lack of touchtype attribute on any browser that isn't safari
      (e.touches[0].touchType === "stylus" || this.treatTouchAsStylus) &&
      this.canDraw
    ) {
      let rect = (e.target as HTMLElement).getBoundingClientRect();
      if (this.canDraw) {
        this.handleDrawStart(
          e.touches[0].clientX - rect.left,
          e.touches[0].clientY - rect.top,
          e.touches[0].force
        );
      } else if (this.erasing) {
        this.handleErase(
          e.touches[0].clientX - rect.left,
          e.touches[0].clientY - rect.top
        );
      }
      return;
    }
    this.lastTouchPosition = [e.touches[0].clientX, e.touches[0].clientY];
    if (e.touches.length === 2) {
      this.lastDist = pytag(
        e.touches[0].clientX,
        e.touches[0].clientY,
        e.touches[1].clientX,
        e.touches[1].clientY
      );
    }
  }

  handleTouchMove(e: TouchEvent) {
    e.preventDefault();

    // Check for apple pencil
    if (
      // @ts-ignore Ignore lack of touchtype attribute on any browser that isn't safari
      (e.touches[0].touchType === "stylus" || this.treatTouchAsStylus) &&
      this.canDraw
    ) {
      let rect = (e.target as HTMLElement).getBoundingClientRect();
      if (this.canDraw) {
        this.handleDraw(
          e.touches[0].clientX - rect.left,
          e.touches[0].clientY - rect.top,
          e.touches[0].force
        );
      } else if (this.erasing) {
        this.handleErase(
          e.touches[0].clientX - rect.left,
          e.touches[0].clientY - rect.top
        );
      }
      return;
    }

    const dx = e.touches[0].clientX - this.lastTouchPosition[0];
    const dy = e.touches[0].clientY - this.lastTouchPosition[1];

    this.lastTouchPosition[0] = e.touches[0].clientX;
    this.lastTouchPosition[1] = e.touches[0].clientY;

    this.scroll(dx, dy);
    if (e.touches.length === 2) {
      const dist = pytag(
        e.touches[0].clientX,
        e.touches[0].clientY,
        e.touches[1].clientX,
        e.touches[1].clientY
      );

      this.zoom(
        Math.sqrt(dist / this.lastDist),
        (e.touches[0].clientX + e.touches[1].clientX) / 2,
        (e.touches[0].clientY + e.touches[1].clientY) / 2
      );

      this.lastDist = dist;
    }
  }

  handleTouchEnd(e: TouchEvent) {
    e.preventDefault();

    this.handleDrawEnd();
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

  scroll(x: number, y: number) {
    if (x < 0) {
      if (
        (this.canvasElement.width * 1) / this.zoomFactor - this.xScroll >=
        this.backgrounds[0].width
      ) {
        x = 0;
      }
    } else if (x > 0) {
      if (-this.xScroll <= 0) {
        x = 0;
      }
    }
    if (y < 0) {
      if (
        (this.canvasElement.height * 1) / this.zoomFactor - this.yScroll >=
        this.documentHeight
      ) {
        y = 0;
      }
    } else if (y > 0) {
      if (-this.yScroll <= 0) {
        y = 0;
      }
    }

    if (this.SMOOTH) {
      this.smoothCanvasScroll(x, y);
    } else {
      this.canvasScroll(x, y);
    }
  }

  zoom(
    factor: number,
    x = this.canvasElement.width / 2,
    y = this.canvasElement.height / 2,
    smooth = this.SMOOTH
  ) {
    if (this.zoomFactor < this.ZOOM_MIN && factor < 1) return;
    if (this.zoomFactor > this.ZOOM_MAX && factor > 1) return;
    if (smooth) {
      this.smoothCanvasZoom(factor, x, y);
    } else {
      this.canvasZoom(factor, x, y);
      if (
        this.canvasElement.width / this.zoomFactor >
        this.backgrounds[0].width
      ) {
        this.canvasHorizontallyCenter();
      }
    }
  }

  smoothCanvasScroll(distX: number, distY: number, conv = false) {
    if (!conv) {
      // Adjusts params so that the total distance traveled is equal to the values given
      // Geometric sequence
      distY = distY * (1 - this.SCROLL_DECEL);
      distX = distX * (1 - this.SCROLL_DECEL);
    }

    this.canvasScroll(distX, distY);
    distY *= this.SCROLL_DECEL;
    distX *= this.SCROLL_DECEL;

    if (Math.abs(distY) < 0.001 && Math.abs(distX) < 0.001) {
      return;
    }

    requestAnimationFrame(
      this.smoothCanvasScroll.bind(this, distX, distY, true)
    );
  }

  smoothCanvasZoom(
    vel: number,
    x = this.canvasElement.width / 2,
    y = this.canvasElement.height / 2
  ) {
    const lb = 0.99;
    const ub = 1.01;

    const decel = 0.99;

    this.canvasZoom(vel, x, y);

    if (vel > 1) {
      vel *= decel;
    } else if (vel < 1) {
      vel /= decel;
    }

    if (vel > lb && vel < ub) {
      if (
        this.canvasElement.width / this.zoomFactor >
        this.backgrounds[0].width
      ) {
        this.canvasHorizontallyCenter();
      }
      return;
    }

    requestAnimationFrame(this.smoothCanvasZoom.bind(this, vel, x, y));
  }

  canvasHorizontallyCenter() {
    if (this.SMOOTH) {
      this.smoothCanvasScroll(
        (this.canvasElement.width / this.zoomFactor / 2 -
          this.xScroll -
          this.backgrounds[0].width / 2) *
          this.zoomFactor,
        0
      );
    } else {
      this.canvasScroll(
        (this.canvasElement.width / this.zoomFactor / 2 -
          this.xScroll -
          this.backgrounds[0].width / 2) *
          this.zoomFactor,
        0
      );
    }
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

  renderStrokes(strokes: Array<iStrokes>) {
    // Find strokes in view
    const strokesToRender = [];
    const TOP_LEFT = [-this.xScroll, -this.yScroll];
    const BOTTOM_RIGHT = [
      (this.canvasElement.width * 1) / this.zoomFactor - this.xScroll,
      (this.canvasElement.height * 1) / this.zoomFactor - this.yScroll,
    ];
    for (let i = 0; i < strokes.length; i++) {
      for (let j = 0; j < strokes[i].points.length; j++) {
        if (
          strokes[i].points[j][0] > TOP_LEFT[0] &&
          strokes[i].points[j][1] > TOP_LEFT[1] &&
          strokes[i].points[j][0] < BOTTOM_RIGHT[0] &&
          strokes[i].points[j][1] < BOTTOM_RIGHT[1]
        ) {
          strokesToRender.push(strokes[i]);
          break;
        }
      }
    }

    for (let i = 0; i < strokesToRender.length; i++) {
      this.context.fillStyle = "#000000";
      this.context.fill(strokesToRender[i].path);

      if (this.debug) {
        // Instantiating Path2D is very expensive (Hence this lags)
        for (let j = 0; j < strokesToRender[i].points.length; j++) {
          const stroke = getStroke([strokesToRender[i].points[j]], {
            ...penOptions,
          });
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
    if (this.drawing)
      this.renderStrokes([
        {
          points: this.points,
          path: new Path2D(
            getSvgPathFromStroke(getStroke(this.points, penOptions))
          ),
        },
      ]);
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
    this.listeners["mousemove"] = this.handleMouseMove.bind(this);
    this.listeners["mousedown"] = this.handleMouseDown.bind(this);
    this.listeners["mouseup"] = this.handleMouseUp.bind(this);
    this.listeners["wheel"] = this.handleScrollWheel.bind(this);
    this.listeners["touchstart"] = this.handleTouchStart.bind(this);
    this.listeners["touchmove"] = this.handleTouchMove.bind(this);
    this.listeners["touchend"] = this.handleTouchEnd.bind(this);

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
    this.canvasElement.addEventListener(
      "touchmove",
      this.listeners["touchmove"]
    );
    this.canvasElement.addEventListener(
      "touchstart",
      this.listeners["touchstart"]
    );
    this.canvasElement.addEventListener("touchend", this.listeners["touchend"]);
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
    this.canvasElement.removeEventListener(
      "touchmove",
      this.listeners["touchmove"]
    );
    this.canvasElement.removeEventListener(
      "touchstart",
      this.listeners["touchstart"]
    );
    this.canvasElement.removeEventListener(
      "touchend",
      this.listeners["touchend"]
    );
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

  get documentHeight() {
    let sum = 0;
    for (let i = 0; i < this.backgrounds.length; i++) {
      sum += this.backgrounds[i].height;
    }
    return sum;
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
