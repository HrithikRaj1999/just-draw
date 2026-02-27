import getStroke from "perfect-freehand";

export const getStrokePath = (stroke: number[][]): string => {
  if (!stroke.length) {
    return "";
  }
  const [firstPoint, ...remainingPoints] = stroke;
  const d = remainingPoints.reduce(
    (acc, [x0, y0], i, points) => {
      const [x1, y1] = points[(i + 1) % points.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", firstPoint[0], firstPoint[1], "Q"] as Array<string | number>,
  );
  d.push("Z");
  return d.join(" ");
};

export const computePathData = (
  points: { x: number; y: number; pressure?: number }[],
  size: number,
): string => {
  if (points.length < 2) return "";
  const mappedPoints = points.map((point) => [
    point.x,
    point.y,
    point.pressure ?? 0.5,
  ]);
  const stroke = getStroke(mappedPoints, {
    size: size,
    thinning: 0.5,
    smoothing: 0.85,
    streamline: 0.85,
    simulatePressure: true,
  });
  return getStrokePath(stroke);
};
