import * as tf from "@tensorflow/tfjs";

const POINTS_PER_STROKE = 10;

function prepareData(points: Array<Array<number>>) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  let data: Array<Array<number>> = [];

  for (let i = 0; i < points.length; i++) {
    if (points[i][0] > maxX) {
      maxX = points[i][0];
    }
    if (points[i][0] < minX) {
      minX = points[i][0];
    }
    if (points[i][1] > maxY) {
      maxY = points[i][1];
    }
    if (points[i][1] < minY) {
      minY = points[i][1];
    }
  }

  if (points.length >= POINTS_PER_STROKE) {
    const step = Math.floor(points.length / POINTS_PER_STROKE);
    let added = 0;
    let curr = 0;
    while (added < POINTS_PER_STROKE) {
      const point = [];
      point.push(((points[curr][0] - minX) / (maxX - minX)) * 100);
      point.push(((points[curr][1] - minY) / (maxY - minY)) * 100);
      data.push(point);

      curr += step;
      added += 1;
    }
  }

  return data;
}

function maxIndex(arr: Array<any>) {
  if (arr.length === 0) {
    return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }

  return maxIndex;
}

async function recogniseCharacter(points: Array<Array<number>>) {
  const letters = ["a", "c", "e", "d", "h", "n"];

  const mod = await tf.loadLayersModel(window.location.href + "/model.json");
  const processedData = prepareData(points);
  const result = mod.predict(tf.tensor([processedData]));
  if (!Array.isArray(result)) {
    const pro = await result.array();
    if (Array.isArray(pro)) {
      if (Array.isArray(pro[0])) {
        const answer = maxIndex(pro[0]);
        console.log(
          "Letter: " + letters[answer] + " |Probability:" + pro[0][answer]
        );
      }
    }
  }
}

export default recogniseCharacter;
