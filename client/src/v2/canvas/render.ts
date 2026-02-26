import getStroke from "perfect-freehand";
import rough from "roughjs/bin/rough";
import type { RoughCanvas } from "roughjs/bin/canvas";
import type { Point, ShapeElement, WhiteboardElement } from "../types/whiteboard";

const BG_COLOR = "#f8fafc";

const getStrokePath = (stroke: number[][]): string => {
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
    ["M", firstPoint[0], firstPoint[1], "Q"] as Array<string | number>
  );
  d.push("Z");
  return d.join(" ");
};

const normalizeShape = (shape: ShapeElement) => {
  const left = Math.min(shape.from.x, shape.to.x);
  const top = Math.min(shape.from.y, shape.to.y);
  const width = Math.abs(shape.to.x - shape.from.x);
  const height = Math.abs(shape.to.y - shape.from.y);
  return {
    left,
    top,
    width,
    height,
  };
};

const drawArrowHead = (ctx: CanvasRenderingContext2D, shape: ShapeElement) => {
  const angle = Math.atan2(shape.to.y - shape.from.y, shape.to.x - shape.from.x);
  const size = Math.max(8, shape.strokeWidth * 3);
  ctx.beginPath();
  ctx.moveTo(shape.to.x, shape.to.y);
  ctx.lineTo(
    shape.to.x - size * Math.cos(angle - Math.PI / 6),
    shape.to.y - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    shape.to.x - size * Math.cos(angle + Math.PI / 6),
    shape.to.y - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = shape.strokeColor;
  ctx.fill();
};

const drawStroke = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
  if (element.type !== "stroke") {
    return;
  }
  if (element.points.length < 2) {
    return;
  }

  const stroke = getStroke(
    element.points.map((point) => [point.x, point.y, point.pressure ?? 0.5]),
    {
      size: element.size,
      thinning: 0.5,
      smoothing: 0.6,
      streamline: 0.55,
      simulatePressure: true,
    }
  );
  const pathData = getStrokePath(stroke);
  if (!pathData) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = element.eraser ? "destination-out" : "source-over";
  ctx.fillStyle = element.color;
  ctx.fill(new Path2D(pathData));
  ctx.restore();
};

const drawShape = (
  ctx: CanvasRenderingContext2D,
  roughCanvas: RoughCanvas,
  element: WhiteboardElement
) => {
  if (element.type !== "shape") {
    return;
  }

  const { left, top, width, height } = normalizeShape(element);

  if (element.shape === "line" || element.shape === "arrow") {
    roughCanvas.line(
      element.from.x,
      element.from.y,
      element.to.x,
      element.to.y,
      {
        stroke: element.strokeColor,
        strokeWidth: element.strokeWidth,
        roughness: 0.8,
      }
    );
    if (element.shape === "arrow") {
      drawArrowHead(ctx, element);
    }
    return;
  }

  if (element.shape === "rectangle") {
    roughCanvas.rectangle(left, top, width, height, {
      stroke: element.strokeColor,
      strokeWidth: element.strokeWidth,
      fill: element.fillColor,
      fillStyle: "solid",
      roughness: 0.9,
    });
    return;
  }

  roughCanvas.ellipse(left + width / 2, top + height / 2, width, height, {
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    fill: element.fillColor,
    fillStyle: "solid",
    roughness: 0.9,
  });
};

const drawText = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
  if (element.type !== "text") {
    return;
  }
  ctx.save();
  ctx.font = `${Math.max(12, element.fontSize)}px "Segoe UI", sans-serif`;
  ctx.fillStyle = element.color;
  ctx.textBaseline = "top";
  ctx.fillText(element.text, element.position.x, element.position.y);
  ctx.restore();
};

export const clearCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

export const drawElements = (
  ctx: CanvasRenderingContext2D,
  elements: WhiteboardElement[],
  draftElement?: WhiteboardElement
) => {
  const roughCanvas = rough.canvas(ctx.canvas);
  const sorted = [...elements].sort((a, b) => a.createdAt - b.createdAt);

  for (const element of sorted) {
    drawStroke(ctx, element);
    drawShape(ctx, roughCanvas, element);
    drawText(ctx, element);
  }

  if (draftElement) {
    drawStroke(ctx, draftElement);
    drawShape(ctx, roughCanvas, draftElement);
    drawText(ctx, draftElement);
  }
};

export const pointerFromEvent = (
  event: PointerEvent,
  canvas: HTMLCanvasElement
): Point => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: event.pressure || 0.5,
  };
};
