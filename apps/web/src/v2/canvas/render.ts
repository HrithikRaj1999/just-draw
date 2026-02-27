import getStroke from "perfect-freehand";
import rough from "roughjs/bin/rough";
import type { RoughCanvas } from "roughjs/bin/canvas";
import type {
  Point,
  ShapeElement,
  WhiteboardElement,
} from "../types/whiteboard";

const BG_COLOR = "#ffffff";

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
    ["M", firstPoint[0], firstPoint[1], "Q"] as Array<string | number>,
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
  const angle = Math.atan2(
    shape.to.y - shape.from.y,
    shape.to.x - shape.from.x,
  );
  const size = Math.max(8, shape.strokeWidth * 3);
  ctx.beginPath();
  ctx.moveTo(shape.to.x, shape.to.y);
  ctx.lineTo(
    shape.to.x - size * Math.cos(angle - Math.PI / 6),
    shape.to.y - size * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    shape.to.x - size * Math.cos(angle + Math.PI / 6),
    shape.to.y - size * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fillStyle = shape.strokeColor;
  ctx.fill();
};

const drawStroke = (
  ctx: CanvasRenderingContext2D,
  element: WhiteboardElement,
) => {
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
    },
  );
  const pathData = getStrokePath(stroke);
  if (!pathData) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = element.eraser
    ? "destination-out"
    : "source-over";
  ctx.fillStyle = element.color;
  ctx.fill(new Path2D(pathData));
  ctx.restore();
};

const drawShape = (
  ctx: CanvasRenderingContext2D,
  roughCanvas: RoughCanvas,
  element: WhiteboardElement,
) => {
  if (element.type !== "shape") {
    return;
  }

  const { left, top, width, height } = normalizeShape(element);
  const options = {
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    fill: element.fillColor,
    fillStyle: "solid",
    roughness: 0,
    seed: element.createdAt || 1,
  };

  if (element.shape === "line" || element.shape === "arrow") {
    roughCanvas.line(
      element.from.x,
      element.from.y,
      element.to.x,
      element.to.y,
      options,
    );
    if (element.shape === "arrow") {
      drawArrowHead(ctx, element);
    }
    return;
  }

  if (element.shape === "rectangle") {
    roughCanvas.rectangle(left, top, width, height, options);
    return;
  }

  if (element.shape === "ellipse") {
    roughCanvas.ellipse(
      left + width / 2,
      top + height / 2,
      width,
      height,
      options,
    );
    return;
  }

  if (element.shape === "db") {
    const rx = width / 2;
    const ry = Math.min(height * 0.15, 20);
    const cx = left + rx;

    // Body lines
    roughCanvas.line(left, top + ry, left, top + height - ry, options);
    roughCanvas.line(
      left + width,
      top + ry,
      left + width,
      top + height - ry,
      options,
    );
    // Top cylinder
    roughCanvas.ellipse(cx, top + ry, width, ry * 2, options);
    // Bottom cylinder (arc approximated by an ellipse portion overlay or a polygon if needed, relying on arc here)
    roughCanvas.arc(
      cx,
      top + height - ry,
      width,
      ry * 2,
      0,
      Math.PI,
      false,
      options,
    );
    return;
  }

  if (element.shape === "balancer") {
    roughCanvas.rectangle(left, top, width, height, options);
    ctx.font = `bold ${Math.max(12, Math.min(width, height) * 0.4)}px "Segoe UI", sans-serif`;
    ctx.fillStyle = element.strokeColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LB", left + width / 2, top + height / 2);
    return;
  }

  if (element.shape === "computer") {
    const monitorHeight = height * 0.7;
    const standHeight = height * 0.2;
    // Monitor
    roughCanvas.rectangle(left, top, width, monitorHeight, options);
    // Stand
    roughCanvas.line(
      left + width * 0.4,
      top + monitorHeight,
      left + width * 0.6,
      top + monitorHeight,
      options,
    );
    roughCanvas.line(
      left + width * 0.5,
      top + monitorHeight,
      left + width * 0.5,
      top + monitorHeight + standHeight,
      options,
    );
    // Keyboard base
    roughCanvas.line(
      left + width * 0.2,
      top + monitorHeight + standHeight,
      left + width * 0.8,
      top + monitorHeight + standHeight,
      options,
    );
    return;
  }

  if (element.shape === "server") {
    const rackHeight = height / 3;
    roughCanvas.rectangle(left, top, width, height, options);
    roughCanvas.line(
      left,
      top + rackHeight,
      left + width,
      top + rackHeight,
      options,
    );
    roughCanvas.line(
      left,
      top + rackHeight * 2,
      left + width,
      top + rackHeight * 2,
      options,
    );
    // Add tiny circle indicator lights
    roughCanvas.circle(
      left + width * 0.1,
      top + rackHeight * 0.5,
      Math.min(width, height) * 0.05,
      options,
    );
    roughCanvas.circle(
      left + width * 0.1,
      top + rackHeight * 1.5,
      Math.min(width, height) * 0.05,
      options,
    );
    roughCanvas.circle(
      left + width * 0.1,
      top + rackHeight * 2.5,
      Math.min(width, height) * 0.05,
      options,
    );
    return;
  }

  if (element.shape === "client") {
    // Smartphone shape (tall rectangle with small button)
    roughCanvas.rectangle(
      left,
      top,
      width,
      height,
      Object.assign({}, options, { fill: undefined }),
    );
    const btnSize = Math.min(width, height) * 0.1;
    roughCanvas.circle(
      left + width / 2,
      top + height - btnSize * 1.5,
      btnSize,
      options,
    );
    return;
  }
};

const drawText = (
  ctx: CanvasRenderingContext2D,
  element: WhiteboardElement,
) => {
  if (element.type !== "text") {
    return;
  }
  ctx.save();
  ctx.font = `${Math.max(12, element.fontSize)}px "Segoe UI", sans-serif`;
  ctx.fillStyle = element.color;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  // The text tool uses a textarea for input where the newlines might be present. Split and render.
  const lines = element.text.split("\n");
  lines.forEach((line, index) => {
    ctx.fillText(
      line,
      element.position.x,
      element.position.y + index * element.fontSize * 1.2,
    );
  });
  ctx.restore();
};

export const getElementBounds = (element: WhiteboardElement) => {
  if (element.type === "shape") {
    return normalizeShape(element);
  }
  if (element.type === "text") {
    return {
      left: element.position.x,
      top: element.position.y,
      width: element.text.length * (element.fontSize * 0.6), // approximate
      height: element.fontSize,
    };
  }
  if (element.type === "stroke") {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of element.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
  return { left: 0, top: 0, width: 0, height: 0 };
};

export const clearCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
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
  draftElement?: WhiteboardElement,
  selectedElementId?: string | null,
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

  if (selectedElementId) {
    const selected =
      elements.find((e) => e.id === selectedElementId) ||
      (draftElement?.id === selectedElementId ? draftElement : null);
    if (selected) {
      const bounds = getElementBounds(selected);
      ctx.save();
      ctx.strokeStyle = "#3b82f6"; // Tailwind blue-500
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        bounds.left - 4,
        bounds.top - 4,
        bounds.width + 8,
        bounds.height + 8,
      );
      ctx.restore();
    }
  }
};

export const pointerFromEvent = (
  event: PointerEvent,
  canvas: HTMLCanvasElement,
): Point => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    pressure: event.pressure || 0.5,
  };
};
