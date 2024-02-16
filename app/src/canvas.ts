import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./svgPathFromStroke";
import "./canvas.css";
import downloadPDF from "./pdf";
import { Note, noteData } from "./file";

// Default pen options
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

// Find distance between to points defined in the 2d plane
function pytag(x_1: number, y_1: number, x_2: number, y_2: number) {
  const dx = x_2 - x_1;
  const dy = y_2 - y_1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Interface for a pen stroke
interface iStrokes {
  points: Array<Array<number>>;
  path: Path2D;
  colour: string;
  thickness: number;
}

interface iCanvasOptions {
  smooth: boolean;
  linearInterpolation: boolean;
  onlyWriteWithApplePencil: boolean;
  debug: boolean;
}

const listener: { [key: string]: (e: Event) => void } = {};

// Predefined colours and thicknesses
const colours = ["#000000", "#FFFFFF", "#AFDCEC", "#ff4040", "#c8ecc7"];
const thicknesses = [3, 5, 8];

// Define a function called ToolBar that takes two arguments: mainCanvas and openDocuments
function ToolBar(mainCanvas: Canvas, openDocuments: Function) {
  // Get the HTML elements with the specified IDs
  const penBTN = document.getElementById("pen");
  const eraserBTN = document.getElementById("eraser");
  const addBTN = document.getElementById("add");
  const closeBTN = document.getElementById("close");
  const colourSelect = document.getElementById("colourSelect");
  const thicknessSelect = document.getElementById("thicknessSelect");

  // Check if all the HTML elements exist
  if (
    penBTN &&
    eraserBTN &&
    addBTN &&
    closeBTN &&
    colourSelect &&
    thicknessSelect
  ) {
    // Remove previous event listeners and effect

    // Set the class name of penBTN and eraserBTN to "inactive"
    penBTN.className = "inactive";
    eraserBTN.className = "inactive";

    // Remove the event listeners for the click event on penBTN, eraserBTN, addBTN, and closeBTN
    penBTN.removeEventListener("click", listener["penBTN"]);
    eraserBTN.removeEventListener("click", listener["eraserBTN"]);
    addBTN.removeEventListener("click", listener["addBTN"]);
    closeBTN.removeEventListener("click", listener["closeBTN"]);

    // Clear the innerHTML of colourSelect and thicknessSelect
    colourSelect.innerHTML = "";
    thicknessSelect.innerHTML = "";

    // Loop through the thicknesses array
    for (let i = 0; i < thicknesses.length; i++) {
      // Create a new div element and set its class and style properties
      const div = document.createElement("div");
      div.classList.add("inline");
      div.classList.add("align-middle");
      div.classList.add("circle-center");
      div.style.width = "40px";
      div.style.height = "40px";

      // Create a new span element and set its class and style properties
      const span = document.createElement("span");
      if (i == 0) {
        span.classList.add("selected");
        mainCanvas.thickness = thicknesses[i];
      } else {
        span.classList.add("glow");
      }
      span.classList.add("dot");
      span.style.backgroundColor = "white";
      span.style.width = thicknesses[i] * 4 + "px";
      span.style.height = thicknesses[i] * 4 + "px";

      // Add a click event listener to the span element
      span.addEventListener("click", () => {
        // Loop through the children of thicknessSelect
        for (let j = 0; j < thicknessSelect.children.length; j++) {
          // If the current child is the clicked span, add the "selected" class and remove the "glow" class
          // Otherwise, remove the "selected" class and add the "glow" class
          if (j == i) {
            span.classList.add("selected");
            span.classList.remove("glow");
          } else {
            thicknessSelect.children[j].children[0].classList.remove(
              "selected"
            );
            thicknessSelect.children[j].children[0].classList.add("glow");
          }
        }
        // Set the thickness of mainCanvas to the current thickness
        mainCanvas.thickness = thicknesses[i];
      });

      // Append the span element to the div element and append the div element to thicknessSelect
      div.appendChild(span);
      thicknessSelect.append(div);
    }

    // Loop through the colours array
    for (let i = 0; i < colours.length; i++) {
      // Create a new span element and set its class and style properties
      const span = document.createElement("span");
      span.classList.add("align-middle");
      if (i == 0) {
        span.classList.add("selected");
        mainCanvas.colour = colours[i];
      } else {
        span.classList.add("glow");
      }
      span.classList.add("dot");
      span.style.backgroundColor = colours[i];

      // Add a click event listener to the span element
      span.addEventListener("click", () => {
        // Loop through the children of colourSelect
        for (let j = 0; j < colourSelect.children.length; j++) {
          // If the current child is the clicked span, add the "selected" class and remove the "glow" class
          // Otherwise, remove the "selected" class and add the "glow" class
          if (j == i) {
            colourSelect.children[j].classList.add("selected");
            colourSelect.children[j].classList.remove("glow");
          } else {
            colourSelect.children[j].classList.remove("selected");
            colourSelect.children[j].classList.add("glow");
          }
        }
        // Set the colour of mainCanvas to the current colour
        mainCanvas.colour = colours[i];
      });

      // Append the span element to colourSelect
      colourSelect.appendChild(span);
    }

    // Define the event listeners for the pen and eraser buttons
    listener["penBTN"] = () => {
      // Toggle the canDraw property of mainCanvas and set the erasing property to false
      mainCanvas.canDraw = !mainCanvas.canDraw;
      mainCanvas.erasing = false;

      // Set the class name of eraserBTN to "inactive"
      eraserBTN.className = "inactive";
      // If canDraw is true, set the class name of penBTN to "active"
      // Otherwise, set it to "inactive"
      if (mainCanvas.canDraw) {
        penBTN.className = "active";
      } else {
        penBTN.className = "inactive";
      }
    };

    listener["eraserBTN"] = () => {
      // Set the canDraw property of mainCanvas to false and toggle the erasing property
      mainCanvas.canDraw = false;
      mainCanvas.erasing = !mainCanvas.erasing;

      // Set the class name of penBTN to "inactive"
      penBTN.className = "inactive";
      // If erasing is true, set the class name of eraserBTN to "active"
      // Otherwise, set it to "inactive"
      if (mainCanvas.erasing) {
        eraserBTN.className = "active";
      } else {
        eraserBTN.className = "inactive";
      }
    };

    // Add new listeners
    listener["addBTN"] = () => {
      mainCanvas.addBackground();
    };
    listener["closeBTN"] = () => {
      mainCanvas.note.data = mainCanvas.save();
      openDocuments();
    };

    
    penBTN.addEventListener("click", listener["penBTN"]);
    eraserBTN.addEventListener("click", listener["eraserBTN"]);
    addBTN.addEventListener("click", listener["addBTN"]);

    closeBTN.addEventListener("click", listener["closeBTN"]);
  }
}

class Canvas {
  canvasElement: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  strokes: Array<iStrokes> = [];
  canDraw = false;
  erasing = false;
  drawing = false;
  points: Array<Array<number>> = [];

  // Define constants which define behaviour of canvas
  xScroll = 0;
  yScroll = 0;
  SCROLL_DECEL = 0.8;
  SCROLL = 50;

  zoomFactor = 1;
  ZOOM_MULT = 1.1;
  ZOOM_MIN = 0.5;
  ZOOM_MAX = 10;

  INTERPOLATE_DIST = 10;

  smooth = true;
  linearInterpolation = true;
  onlyWriteWithApplePencil = false;
  debug = false;

  // Store page backgrounds/templates
  backgrounds: Array<HTMLImageElement> = [];
  GAPBETWEENPAGES = 20;

  listeners: iListeners = {};

  note: Note;

  // Default pen colour and thickness
  colour = "#000000";
  thickness = 5;

  saveCallback: Function;

  // Handle behaviour of scroll wheel
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

    // Prevent default behaviour
    e.preventDefault();
  }

  // Handle behaviour when pressing the mouse down
  handleMouseDown(e: MouseEvent) {
    let rect = (e.target as HTMLElement).getBoundingClientRect();
    // Check if mouse1 is down and mouse is on the page
    if (
      e.buttons == 1 &&
      this.pageCursorIsOn(e.clientX, e.clientY, rect) !== -1
    ) {
      if (this.canDraw) {
        // Draw on canvas
        this.drawing = true;
        this.handleDrawStart(e.clientX - rect.left, e.clientY - rect.top, 0.5);
      } else if (this.erasing) {
        // Erase
        this.handleErase(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  }

  // Handle behaviour when pressing mousedown is released
  handleMouseUp() {
    // Stop drawing
    this.handleDrawEnd();
  }

  // Handle behaviour when moving them mouse
  handleMouseMove(e: MouseEvent) {
    let rect = (e.target as HTMLElement).getBoundingClientRect();

    // If mouse is off page, stop drawing
    if (this.pageCursorIsOn(e.clientX, e.clientY, rect) === -1) {
      this.handleMouseUp();
      return;
    }
    if (e.buttons == 1) {
      if (this.drawing) {
        this.handleDraw(e.clientX - rect.left, e.clientY - rect.top, 0.5);
      } else if (this.erasing) {
        this.handleErase(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  }

  // Handle when you start drawing a stroke
  handleDrawStart(x: number, y: number, pressure: number) {
    // Add current mouse position to the array of points that make up the stroke
    this.points.push([
      x / this.zoomFactor - this.xScroll,
      y / this.zoomFactor - this.yScroll,
      pressure,
    ]);

    // Render the new pen stroke
    this.renderStrokes([
      {
        points: this.points,
        path: new Path2D(
          getSvgPathFromStroke(
            getStroke(this.points, { ...penOptions, size: this.thickness })
          )
        ),
        colour: this.colour,
        thickness: this.thickness,
      },
    ]);
  }

  // Handle when you are drawing a stroke
  handleDraw(x: number, y: number, pressure: number) {
    // Compute distance between current and previous point
    const dist = pytag(
      x / this.zoomFactor - this.xScroll,
      y / this.zoomFactor - this.yScroll,
      this.points[this.points.length - 1][0],
      this.points[this.points.length - 1][1]
    );

    // Interpolation if distance is too large
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

      // Add points at even intervals between the current and last point
      for (let i = 0; i < Math.floor(dist / this.INTERPOLATE_DIST); i++) {
        this.points.push([
          this.points[this.points.length - 1][0] +
            dx / Math.floor(dist / this.INTERPOLATE_DIST),
          this.points[this.points.length - 1][1] +
            dy / Math.floor(dist / this.INTERPOLATE_DIST),
        ]);
      }
    }

    // Add current mouse position to points
    this.points.push([
      x / this.zoomFactor - this.xScroll,
      y / this.zoomFactor - this.yScroll,
      pressure,
    ]);

    if (this.points.length % 10) {
      this.render();
    }
    // Only render then new line being drawn
    this.renderStrokes([
      {
        points: this.points,
        path: new Path2D(
          getSvgPathFromStroke(
            getStroke(this.points, { ...penOptions, size: this.thickness })
          )
        ),
        colour: this.colour,
        thickness: this.thickness,
      },
    ]);
  }

  // Handle when you finish drawing a stroke
  handleDrawEnd() {
    // Only take action if previously drawing
    if (this.drawing) {
      this.drawing = false;
      this.strokes.push({
        points: this.points,
        path: new Path2D(
          getSvgPathFromStroke(
            getStroke(this.points, { ...penOptions, size: this.thickness })
          )
        ),
        colour: this.colour,
        thickness: this.thickness,
      });

      // Clear array of points
      this.points = [];

      // Save to disk
      this.saveToDisk();

      // Rerender strokes
      this.render();
    }
  }

  handleErase(x: number, y: number) {
    let erased = false;

    // Check every stroke
    for (let i = 0; i < this.strokes.length; i++) {
      for (let j = 0; j < this.strokes[i].points.length; j++) {
        // Check if distance between cursor and stroke is less than 10
        if (
          pytag(
            x / this.zoomFactor - this.xScroll,
            y / this.zoomFactor - this.yScroll,
            this.strokes[i].points[j][0],
            this.strokes[i].points[j][1]
          ) <= 10
        ) {
          // Remove stroke
          this.strokes.splice(i, 1);
          erased = true;
          break;
        }
      }
    }

    // Save and rerender if strokes are erased
    if (erased) {
      this.saveToDisk();
      this.render();
    }
  }

  // Store last touch position
  lastTouchPosition: Array<number> = [];
  lastDist = 0;

  // Handle beginning of touch input
  handleTouchStart(e: TouchEvent) {
    // Prevent default zooming behaviour
    e.preventDefault();

    let rect = (e.target as HTMLElement).getBoundingClientRect();

    let applePencilInput = false;

    // Check if input is  apple pencil
    if (this.onlyWriteWithApplePencil) {
      // @ts-ignore Ignore lack of touchtype attribute on any browser that isn't safari
      applePencilInput = e.touches[0].touchType === "stylus";
    } else {
      applePencilInput = true;
    }

    if (
      this.canDraw &&
      this.pageCursorIsOn(e.touches[0].clientX, e.touches[0].clientY, rect) !==
        -1 &&
      applePencilInput
    ) {
      // Draw
      this.drawing = true;
      this.handleDrawStart(
        e.touches[0].clientX - rect.left,
        e.touches[0].clientY - rect.top,
        e.touches[0].force
      );
    } else if (this.erasing && applePencilInput) {
      // Erase
      this.handleErase(
        e.touches[0].clientX - rect.left,
        e.touches[0].clientY - rect.top
      );
      return;
    } else {
      // Store last primary touch position
      this.lastTouchPosition = [e.touches[0].clientX, e.touches[0].clientY];
      // Find distance between two touch points
      if (e.touches.length === 2) {
        this.lastDist = pytag(
          e.touches[0].clientX,
          e.touches[0].clientY,
          e.touches[1].clientX,
          e.touches[1].clientY
        );
      }
    }
  }

  handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    let rect = (e.target as HTMLElement).getBoundingClientRect();

    let applePencilInput = false;

    // Check for apple pencil
    if (this.onlyWriteWithApplePencil) {
      // @ts-ignore Ignore lack of touchtype attribute on any browser that isn't safari
      applePencilInput = e.touches[0].touchType === "stylus";
    } else {
      applePencilInput = true;
    }

    if (
      this.canDraw &&
      this.pageCursorIsOn(e.touches[0].clientX, e.touches[0].clientY, rect) !==
        -1 &&
      applePencilInput
    ) {
      // Draw
      this.handleDraw(
        e.touches[0].clientX - rect.left,
        e.touches[0].clientY - rect.top,
        e.touches[0].force
      );
    } else if (this.erasing && applePencilInput) {
      // Erase
      this.handleErase(
        e.touches[0].clientX - rect.left,
        e.touches[0].clientY - rect.top
      );
      return;
    } else {
      // Compare current and last touch points, to determine how much to scroll by
      const dx = e.touches[0].clientX - this.lastTouchPosition[0];
      const dy = e.touches[0].clientY - this.lastTouchPosition[1];

      this.lastTouchPosition[0] = e.touches[0].clientX;
      this.lastTouchPosition[1] = e.touches[0].clientY;

      this.scroll(dx, dy);

      if (e.touches.length === 2) {
        // Compare last two touch points, to decide whether pinch gesture is to zoom in or zoom out
        const dist = pytag(
          e.touches[0].clientX,
          e.touches[0].clientY,
          e.touches[1].clientX,
          e.touches[1].clientY
        );

        // Zoom depending on the ratio between the current distance between touch points and the previous distance
        this.zoom(
          Math.sqrt(dist / this.lastDist),
          (e.touches[0].clientX + e.touches[1].clientX) / 2,
          (e.touches[0].clientY + e.touches[1].clientY) / 2
        );

        this.lastDist = dist;
      }
    }
  }

  // Handle the end of touch input
  handleTouchEnd(e: TouchEvent) {
    e.preventDefault();

    // Stop drawing
    this.handleDrawEnd();
  }

  // Determine which page the cursor is on
  pageCursorIsOn(x: number, y: number, rect: DOMRect) {
    // Define the borders of the page
    const TOP_LEFT = [-this.xScroll, -this.yScroll];
    const POS = [
      TOP_LEFT[0] + (x - rect.left) / this.zoomFactor,
      TOP_LEFT[1] + (y - rect.top) / this.zoomFactor,
    ];
    let currY = 0;

    for (let i = 0; i < this.backgrounds.length; i++) {
      // If the borders are within the current coordinates then cursors is on current page
      if (
        POS[0] > 0 &&
        POS[1] > currY &&
        POS[0] < this.backgrounds[i].width &&
        POS[1] < currY + this.backgrounds[i].height
      ) {
        return i + 1;
      }
      currY += this.backgrounds[i].height + this.GAPBETWEENPAGES;
    }
    // If cannot determine the page, page is not on cursor, return -1
    return -1;
  }

  // General scroll interface
  scroll(x: number, y: number) {
    // Constraints, to not let user scroll page out of view
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

    // Perform smooth scroll animation depending on whether or not the user has specified to use smooth animations in the canvas options
    if (this.smooth) {
      this.smoothCanvasScroll(x, y);
    } else {
      this.canvasScroll(x, y);
    }
  }

  // General zoom interface
  zoom(
    factor: number,
    x = this.canvasElement.width / 2,
    y = this.canvasElement.height / 2,
    smooth = this.smooth
  ) {
    // Don't zoom if preconditions aren't met
    if (this.zoomFactor < this.ZOOM_MIN && factor < 1) return;
    if (this.zoomFactor > this.ZOOM_MAX && factor > 1) return;

    // If smooth is specified, use smooth animation
    if (smooth) {
      this.smoothCanvasZoom(factor, x, y);
    } else {
      this.canvasZoom(factor, x, y);
      if (
        this.canvasElement.width / this.zoomFactor >
        this.backgrounds[0].width
      ) {
        // Horizontally center canvas if off center
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

    // Scroll canvas
    this.canvasScroll(distX, distY);

    // Declerate canvas
    distY *= this.SCROLL_DECEL;
    distX *= this.SCROLL_DECEL;

    if (Math.abs(distY) < 0.001 && Math.abs(distX) < 0.001) {
      // If velocity is neglible, stop scrolling
      return;
    }

    // Request animation frame from the browser to allow for smooth scrolling
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

    // Decelerate zooming
    if (vel > 1) {
      vel *= decel;
    } else if (vel < 1) {
      vel /= decel;
    }

    // If velocity is negligible, stop zooming
    if (vel > lb && vel < ub) {
      // If page is off center, horizontally center
      if (
        this.canvasElement.width / this.zoomFactor >
        this.backgrounds[0].width
      ) {
        this.canvasHorizontallyCenter();
      }
      return;
    }

    // Request animation frame from the browser to allow for smooth zooming
    requestAnimationFrame(this.smoothCanvasZoom.bind(this, vel, x, y));
  }

  canvasHorizontallyCenter() {
    // Scroll to horizontally center page
    if (this.smooth) {
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

  // Primitive which scrolls canvas
  canvasScroll(x: number, y: number) {
    this.xScroll += x / this.zoomFactor;
    this.yScroll += y / this.zoomFactor;

    this.context.translate(x / this.zoomFactor, y / this.zoomFactor);
    this.render();
  }

  // Primitive which zooms canvas
  canvasZoom(
    factor: number,
    x = this.canvasElement.width / 2,
    y = this.canvasElement.height / 2
  ) {
    // Scroll to orgin
    this.canvasScroll(-x, -y);

    // Increase zoom factor
    this.zoomFactor *= factor;

    // Remove previous transformation
    this.context.resetTransform();

    // Zoom
    this.context.scale(this.zoomFactor, this.zoomFactor);
    this.context.translate(this.xScroll, this.yScroll);
    // Rerender
    this.render();

    // Scroll canvas back to original position
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

    // Check if strokes are in view
    for (let i = 0; i < strokes.length; i++) {
      for (let j = 0; j < strokes[i].points.length; j++) {
        if (
          strokes[i].points[j][0] > TOP_LEFT[0] &&
          strokes[i].points[j][1] > TOP_LEFT[1] &&
          strokes[i].points[j][0] < BOTTOM_RIGHT[0] &&
          strokes[i].points[j][1] < BOTTOM_RIGHT[1]
        ) {
          // If in view, render
          strokesToRender.push(strokes[i]);
          break;
        }
      }
    }

    for (let i = 0; i < strokesToRender.length; i++) {
      this.context.fillStyle = strokesToRender[i].colour;
      this.context.fill(strokesToRender[i].path);

      if (this.debug) {
        // Instantiating Path2D is very expensive (Hence this lags)
        for (let j = 0; j < strokesToRender[i].points.length; j++) {
          const stroke = getStroke([strokesToRender[i].points[j]], {
            ...penOptions,
          });
          // Generate SVG
          const pathData = getSvgPathFromStroke(stroke);
          const path = new Path2D(pathData);

          this.context.fillStyle = "#FF0000";

          // Draw SVG
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
      // Check if pages are in view
      if (
        BOTTOM_RIGHT[0] > 0 &&
        BOTTOM_RIGHT[1] > currY &&
        TOP_LEFT[0] < this.backgrounds[i].width &&
        TOP_LEFT[1] < currY + this.backgrounds[i].height
      ) {
        // Render page
        this.context.drawImage(this.backgrounds[i], 0, currY);
        // Render background
        this.context.strokeRect(
          0,
          currY,
          this.backgrounds[i].width,
          this.backgrounds[i].height
        );
      }
      currY += this.backgrounds[i].height + this.GAPBETWEENPAGES;
    }
  }

  // Render
  render() {
    // Clear canvas
    this.clearCanvas();

    // Render background
    this.renderBackground();

    // Render strokes
    this.renderStrokes(this.strokes);
    if (this.drawing)
      // Render current stroke
      this.renderStrokes([
        {
          points: this.points,
          path: new Path2D(
            getSvgPathFromStroke(
              getStroke(this.points, { ...penOptions, size: this.thickness })
            )
          ),
          colour: this.colour,
          thickness: this.thickness,
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

  // Resize the canvas
  resizeCanvas(width: number, height: number) {
    this.canvasElement.height = height;
    this.canvasElement.width = width;
  }

  // Add another page to the document
  addBackground(num = this.backgrounds.length - 1) {
    this.backgrounds.push(this.backgrounds[num]);
    this.render();
  }

  // Define a method called bindListeners
  bindListeners() {
    // Bind the event handlers to the current context (this)
    this.listeners["mousemove"] = this.handleMouseMove.bind(this);
    this.listeners["mousedown"] = this.handleMouseDown.bind(this);
    this.listeners["mouseup"] = this.handleMouseUp.bind(this);
    this.listeners["wheel"] = this.handleScrollWheel.bind(this);
    this.listeners["touchstart"] = this.handleTouchStart.bind(this);
    this.listeners["touchmove"] = this.handleTouchMove.bind(this);
    this.listeners["touchend"] = this.handleTouchEnd.bind(this);

    // Add event listeners for the mousemove, mousedown, mouseup, wheel, touchmove, touchstart, and touchend events
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

  // Define a method called removeListener
  removeListener() {
    // Remove the event listeners for the pointermove, pointerdown, pointerup, wheel, touchmove, touchstart, and touchend events
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

  // Set new background
  async setTemplate(url: string) {
    this.background = await downloadPDF(url);
  }

  // Set background
  set background(blobs: Array<string>) {
    this.backgrounds = [];
    // Iterate through pages
    for (let i = 0; i < blobs.length; i++) {
      // Create new image
      const img = new Image();
      img.src = blobs[i];

      // Add image to background
      this.backgrounds.push(img);
    }
    setTimeout(() => {
      // Rerender and add listeners
      this.render();
      this.bindListeners();
    }, 1);
  }

  // Convert data to an object
  save() {
    const strokePoints = this.strokes.map((x) => ({
      points: x.points,
      colour: x.colour,
      thickness: x.thickness,
    }));
    const backgrounds = this.backgrounds.map((x) => x.src);
    const data: noteData = { backgrounds: backgrounds, strokes: strokePoints };

    return data;
  }

  // Save data to disk after every change
  saveToDisk() {
    this.note.data = this.save();
    this.saveCallback();
  }

  // Take object and injest it into the canvas
  load(data: noteData) {
    this.strokes = data.strokes.map((x) => ({
      points: x.points,
      path: new Path2D(
        getSvgPathFromStroke(
          getStroke(x.points, { ...penOptions, size: x.thickness })
        )
      ),
      colour: x.colour,
      thickness: x.thickness,
    }));
    this.background = data.backgrounds;
  }

  //
  // Getters and Setters
  //

  get element() {
    return this.canvasElement;
  }

  set allowedToDraw(value: boolean) {
    this.canDraw = value;
  }

  get documentHeight() {
    let sum = 0;
    for (let i = 0; i < this.backgrounds.length; i++) {
      sum += this.backgrounds[i].height;
    }
    return sum;
  }

  constructor(
    width: number,
    height: number,
    note: Note,
    options: iCanvasOptions,
    saveCallBack: Function
  ) {
    this.smooth = options.smooth;
    this.linearInterpolation = options.linearInterpolation;
    this.onlyWriteWithApplePencil = options.onlyWriteWithApplePencil;
    this.debug = options.debug;

    this.saveCallback = saveCallBack;

    this.note = note;
    this.load(note.data);

    const canvas = document.createElement("canvas");
    this.canvasElement = canvas;
    const ctx = canvas.getContext("2d");

    // Check that context can be obtained
    if (ctx !== null) {
      this.context = ctx;
    } else {
      throw new Error("Cannot get canvas context");
    }

    // Resize canvas
    this.resizeCanvas(width, height);
  }
}

export { Canvas, ToolBar, type iCanvasOptions };
