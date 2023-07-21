import { useEffect } from "react";
import { getStroke } from "perfect-freehand";
import getSvgPathFromStroke from "./svgPathFromStroke";

interface iCanvas {
  element: HTMLCanvasElement | undefined;
  width: number;
  height: number;
  backgrounds: Array<HTMLImageElement>;
}

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

function Canvas(props: iCanvas) {
  let drawing = false;
  let points: Array<Array<number>> = [];
  const strokes: Array<Array<Array<number>>> = [];

  const canDraw = true;

  let xScroll = 0;
  let yScroll = 0;
  let zoomFactor = 1;

  const ZOOM_MULT = 1.25;
  const SCROLL = 20;

  // const [context, setContext] = useState<CanvasRenderingContext2D>();
  let context: CanvasRenderingContext2D | undefined;

  function handlePointerDown(e: PointerEvent) {
    if (e.buttons == 1 && canDraw && pageCursorIsOn(e) !== -1) {
      drawing = true;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      points.push([
        (e.clientX - rect.left) / zoomFactor - xScroll,
        (e.clientY - rect.top) / zoomFactor - yScroll,
        e.pressure,
      ]);
      renderStrokes([points]);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (drawing && pageCursorIsOn(e) !== -1) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      points.push([
        (e.clientX - rect.left) / zoomFactor - xScroll,
        (e.clientY - rect.top) / zoomFactor - yScroll,
        e.pressure,
      ]);

      if (!(points.length % 10)) {
        render();
      }
      // Only render then new line being drawn
      renderStrokes([points]);
    }
  }

  function handlePointerUp() {
    drawing = false;
    strokes.push(points);
    points = [];
    render();
  }

  function pageCursorIsOn(e: MouseEvent) {
    const TOP_LEFT = [-xScroll, -yScroll];
    const POS = [
      TOP_LEFT[0] + e.clientX / zoomFactor,
      TOP_LEFT[1] + e.clientY / zoomFactor,
    ];
    let currY = 0;

    for (let i = 0; i < props.backgrounds.length; i++) {
      if (
        POS[0] > 0 &&
        POS[1] > currY &&
        POS[0] < props.backgrounds[i].width &&
        POS[1] < currY + props.backgrounds[i].height
      ) {
        return i + 1;
      }
      currY += props.backgrounds[i].height;
    }
    return -1;
  }

  function renderStrokes(strokes: Array<Array<Array<number>>>) {
    // Find strokes in view
    const strokesToRender = [];
    const TOP_LEFT = [-xScroll, -yScroll];
    const BOTTOM_RIGHT = [
      (props.width * 1) / zoomFactor - xScroll,
      (props.height * 1) / zoomFactor - yScroll,
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

      const path = new Path2D(pathData);
      context?.fill(path);
    }
  }

  function renderBackground() {
    let currY = 0;

    const TOP_LEFT = [-xScroll, -yScroll];
    const BOTTOM_RIGHT = [
      (props.width * 1) / zoomFactor - xScroll,
      (props.height * 1) / zoomFactor - yScroll,
    ];

    // Render Backdrop
    if (context !== undefined) {
      context.fillStyle = "#333333";
      context.fillRect(
        TOP_LEFT[0],
        TOP_LEFT[1],
        BOTTOM_RIGHT[0] - TOP_LEFT[0],
        BOTTOM_RIGHT[1] - TOP_LEFT[1]
      );
      // Render PDF
      for (let i = 0; i < props.backgrounds.length; i++) {
        if (
          BOTTOM_RIGHT[0] > 0 &&
          BOTTOM_RIGHT[1] > currY &&
          TOP_LEFT[0] < props.backgrounds[i].width &&
          TOP_LEFT[1] < currY + props.backgrounds[i].height
        ) {
          context.drawImage(props.backgrounds[i], 0, currY);
          context.strokeRect(
            0,
            currY,
            props.backgrounds[i].width,
            props.backgrounds[i].height
          );
        }
        currY += props.backgrounds[i].height;
      }
    }
  }

  function handleScrollWheel(e: WheelEvent) {
    if (e.deltaY > 0) {
      // Right, Zoom out, down
      if (e.shiftKey) {
        canvasScroll(-SCROLL, 0);
      } else if (e.ctrlKey) {
        // Zoom out
        // canvasScroll(-props.width / 2, -props.height / 2);
        canvasScroll(-e.clientX, -e.clientY);
        canvasZoom(1 / ZOOM_MULT);
        canvasScroll(e.clientX, e.clientY);
        // canvasScroll(props.width / 2, props.height / 2);
      } else {
        canvasScroll(0, -SCROLL);
      }
    } else if (e.deltaY < 0) {
      // Left, Zoom in, up
      if (e.shiftKey) {
        canvasScroll(SCROLL, 0);
      } else if (e.ctrlKey) {
        // canvasScroll(-props.width / 2, -props.height / 2);
        canvasScroll(-e.clientX, -e.clientY);
        canvasZoom(ZOOM_MULT);
        canvasScroll(e.clientX, e.clientY);
        // canvasScroll(props.width / 2, props.height / 2);
      } else {
        canvasScroll(0, SCROLL);
      }
    }

    e.preventDefault();
  }

  function canvasScroll(x: number, y: number) {
    xScroll += x / zoomFactor;
    yScroll += y / zoomFactor;

    context?.translate(x / zoomFactor, y / zoomFactor);
    render();
    // window.requestAnimationFrame(this.render.bind(this));
  }

  function canvasZoom(factor: number) {
    zoomFactor *= factor;

    context?.resetTransform();

    context?.scale(zoomFactor, zoomFactor);
    context?.translate(xScroll, yScroll);
    render();
  }

  function clearCanvas() {
    context?.beginPath();

    // Store the current transformation matrix
    context?.save();

    // Use the identity matrix while clearing the canvas
    context?.setTransform(1, 0, 0, 1, 0, 0);
    context?.clearRect(0, 0, props.width, props.height);

    // Restore the transform
    context?.restore();
  }

  function render() {
    clearCanvas();

    renderBackground();

    renderStrokes(strokes);
    if (drawing) renderStrokes([points]);
  }

  useEffect(() => {
    if (props.element !== undefined) {
      const ctx = props.element.getContext("2d");
      if (ctx !== null && ctx !== undefined) {
        context = ctx;

        props.element.addEventListener("pointermove", handlePointerMove);
        props.element.addEventListener("pointerup", handlePointerUp);
        props.element.addEventListener("pointerdown", handlePointerDown);
        props.element.addEventListener("wheel", handleScrollWheel);

        setTimeout(() => {
          render();
        }, 1);

        return () => {
          if (props.element !== undefined) {
            props.element.removeEventListener("pointermove", handlePointerMove);
            props.element.removeEventListener("pointerup", handlePointerUp);
            props.element.removeEventListener("pointerdown", handlePointerDown);
            props.element.removeEventListener("wheel", handleScrollWheel);
          }
        };
      }
    } else {
      context = undefined;
    }
  }, [props.element]);

  // useEffect(() => {
  //   if (context !== undefined) {
  //     if (props.element !== undefined && props.backgrounds.length !== 0) {
  //       props.element.addEventListener("pointermove", handlePointerMove);
  //       props.element.addEventListener("pointerup", handlePointerUp);
  //       props.element.addEventListener("pointerdown", handlePointerDown);
  //       props.element.addEventListener("wheel", handleScrollWheel);

  //       setTimeout(() => {
  //         render();
  //       }, 1);

  //       return () => {
  //         if (props.element !== undefined) {
  //           props.element.removeEventListener("pointermove", handlePointerMove);
  //           props.element.removeEventListener("pointerup", handlePointerUp);
  //           props.element.removeEventListener("pointerdown", handlePointerDown);
  //           props.element.removeEventListener("wheel", handleScrollWheel);
  //         }
  //       };
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [context]);
  return null;
}

export default Canvas;
