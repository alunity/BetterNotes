import { useRef, useState, useEffect } from "react";
import "./App.css";
import Canvas from "./canvas";
import importPDF from "./pdf";

function App() {
  const canvasRef = useRef(null);

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement>();
  const [pdfBackground, setPDFBackground] = useState<Array<HTMLImageElement>>(
    []
  );

  useEffect(() => {
    if (canvasRef.current !== null) {
      setCanvasElement(canvasRef.current);
    }
  }, [canvasRef]);

  useEffect(() => {
    async function PDF() {
      const blobs = await importPDF(
        "https://arxiv.org/ftp/arxiv/papers/1304/1304.7653.pdf"
      );
      const imgs = [];
      for (let i = 0; i < blobs.length; i++) {
        const img = new Image();
        img.src = blobs[i];
        imgs.push(img);
      }
      setPDFBackground(imgs);
    }
    PDF();
  }, []);

  const width = window.innerWidth - 25;
  const height = window.innerHeight - 25;

  if (pdfBackground.length !== 0) {
    return (
      <>
        <canvas width={width} height={height} ref={canvasRef}></canvas>
        <Canvas
          element={canvasElement}
          backgrounds={pdfBackground}
          width={width}
          height={height}
        />
      </>
    );
  } else {
    return <canvas width={width} height={height} ref={canvasRef}></canvas>;
  }
}

export default App;
