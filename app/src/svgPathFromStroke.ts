// Define a function to calculate the average of two numbers
const average = (a: number, b: number) => (a + b) / 2;

// Define a function to generate an SVG path from a stroke
function getSvgPathFromStroke(points: Array<Array<number>>, closed = true) {
  // Get the length of the points array
  const len = points.length;

  // If there are less than 4 points, return an empty string
  if (len < 4) {
    return ``;
  }

  // Get the first three points from the array
  let a = points[0];
  let b = points[1];
  const c = points[2];

  // Start building the SVG path string with a "move to" command followed by a "quadratic Bézier curve" command
  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
    2
  )},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
    b[1],
    c[1]
  ).toFixed(2)} T`;

  // Loop through the rest of the points in the array
  for (let i = 2, max = len - 1; i < max; i++) {
    // Get the current point and the next point
    a = points[i];
    b = points[i + 1];
    // Add a "smooth quadratic Bézier curveto" command to the SVG path string
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
      2
    )} `;
  }

  // If the path should be closed, add a "closepath" command to the SVG path string
  if (closed) {
    result += "Z";
  }

  // Return the SVG path string
  return result;
}

// Export the getSvgPathFromStroke function as the default export
export default getSvgPathFromStroke;
