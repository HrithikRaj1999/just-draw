"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createId } from "../lib/identity";
import { clearCanvas, drawElements, pointerFromEvent } from "../canvas/render";
import type {
  DrawingTool,
  PresenceState,
  ShapeKind,
  StrokeElement,
  UserIdentity,
  WhiteboardElement,
} from "../types/whiteboard";

interface WhiteboardCanvasProps {
  tool: DrawingTool;
  strokeColor: string;
  strokeSize: number;
  user: UserIdentity;
  elements: Record<string, WhiteboardElement>;
  participants: PresenceState[];
  onUpsertElement: (element: WhiteboardElement) => void;
  onReplaceBoard: (elements: Record<string, WhiteboardElement>) => void;
  onPresenceUpdate: (tool: DrawingTool, cursor?: { x: number; y: number }) => void;
}

export interface WhiteboardCanvasHandle {
  downloadPng: () => void;
  exportJson: () => void;
  clearBoard: () => void;
}

const SHAPE_TOOLS = new Set<DrawingTool>([
  "line",
  "arrow",
  "rectangle",
  "ellipse",
]);

const isShapeTool = (tool: DrawingTool): tool is ShapeKind => SHAPE_TOOLS.has(tool);

const WhiteboardCanvas = forwardRef<WhiteboardCanvasHandle, WhiteboardCanvasProps>(
  (
    {
      tool,
      strokeColor,
      strokeSize,
      user,
      elements,
      participants,
      onUpsertElement,
      onReplaceBoard,
      onPresenceUpdate,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const draftRef = useRef<WhiteboardElement | null>(null);
    const pointerActiveRef = useRef(false);
    const lastElementEmitRef = useRef(0);
    const lastPresenceEmitRef = useRef(0);

    const [draftElement, setDraftElement] = useState<WhiteboardElement | null>(
      null
    );
    const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

    const setDraft = useCallback((element: WhiteboardElement | null) => {
      draftRef.current = element;
      setDraftElement(element);
    }, []);

    const emitPresence = useCallback(
      (x: number, y: number, force?: boolean) => {
        const now = Date.now();
        if (!force && now - lastPresenceEmitRef.current < 50) {
          return;
        }
        lastPresenceEmitRef.current = now;
        onPresenceUpdate(tool, { x, y });
      },
      [onPresenceUpdate, tool]
    );

    const maybeBroadcastDraft = useCallback(
      (element: WhiteboardElement, force?: boolean) => {
        const now = performance.now();
        if (!force && now - lastElementEmitRef.current < 33) {
          return;
        }
        lastElementEmitRef.current = now;
        onUpsertElement(element);
      },
      [onUpsertElement]
    );

    const createStrokeElement = useCallback(
      (startX: number, startY: number, eraser?: boolean): StrokeElement => {
        const now = Date.now();
        return {
          id: createId(),
          type: "stroke",
          createdBy: user.id,
          createdAt: now,
          updatedAt: now,
          points: [{ x: startX, y: startY, pressure: 0.5 }],
          color: eraser ? "#000000" : strokeColor,
          size: strokeSize,
          eraser,
        };
      },
      [strokeColor, strokeSize, user.id]
    );

    const handlePointerDown = useCallback(
      (event: PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }

        const point = pointerFromEvent(event, canvas);
        emitPresence(point.x, point.y, true);

        if (tool === "select" || tool === "hand") {
          return;
        }

        if (tool === "text") {
          const text = window.prompt("Enter text");
          if (!text || text.trim().length === 0) {
            return;
          }
          const now = Date.now();
          onUpsertElement({
            id: createId(),
            type: "text",
            createdBy: user.id,
            createdAt: now,
            updatedAt: now,
            position: point,
            color: strokeColor,
            fontSize: Math.max(14, strokeSize * 4),
            text: text.trim(),
          });
          return;
        }

        pointerActiveRef.current = true;
        canvas.setPointerCapture(event.pointerId);

        if (tool === "pen" || tool === "eraser") {
          const stroke = createStrokeElement(point.x, point.y, tool === "eraser");
          setDraft(stroke);
          maybeBroadcastDraft(stroke, true);
          return;
        }

        if (isShapeTool(tool)) {
          const now = Date.now();
          const shape: WhiteboardElement = {
            id: createId(),
            type: "shape",
            shape: tool,
            createdBy: user.id,
            createdAt: now,
            updatedAt: now,
            from: point,
            to: point,
            strokeColor,
            strokeWidth: strokeSize,
            fillColor: tool === "line" || tool === "arrow" ? undefined : "transparent",
          };
          setDraft(shape);
          maybeBroadcastDraft(shape, true);
        }
      },
      [
        createStrokeElement,
        emitPresence,
        maybeBroadcastDraft,
        onUpsertElement,
        setDraft,
        strokeColor,
        strokeSize,
        tool,
        user.id,
      ]
    );

    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }

        const point = pointerFromEvent(event, canvas);
        emitPresence(point.x, point.y);

        if (!pointerActiveRef.current || !draftRef.current) {
          return;
        }

        if (draftRef.current.type === "stroke") {
          const next: WhiteboardElement = {
            ...draftRef.current,
            updatedAt: Date.now(),
            points: [
              ...draftRef.current.points,
              { x: point.x, y: point.y, pressure: point.pressure },
            ],
          };
          setDraft(next);
          maybeBroadcastDraft(next);
          return;
        }

        if (draftRef.current.type === "shape") {
          const next: WhiteboardElement = {
            ...draftRef.current,
            updatedAt: Date.now(),
            to: { x: point.x, y: point.y, pressure: point.pressure },
          };
          setDraft(next);
          maybeBroadcastDraft(next);
        }
      },
      [emitPresence, maybeBroadcastDraft, setDraft]
    );

    const finalizeDraft = useCallback(() => {
      if (!pointerActiveRef.current || !draftRef.current) {
        return;
      }
      pointerActiveRef.current = false;

      const finalized: WhiteboardElement = {
        ...draftRef.current,
        updatedAt: Date.now(),
      };
      onUpsertElement(finalized);
      setDraft(null);
    }, [onUpsertElement, setDraft]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", finalizeDraft);
      canvas.addEventListener("pointercancel", finalizeDraft);

      return () => {
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", finalizeDraft);
        canvas.removeEventListener("pointercancel", finalizeDraft);
      };
    }, [finalizeDraft, handlePointerDown, handlePointerMove]);

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) {
        return;
      }

      const resize = () => {
        const rect = container.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        const ratio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return;
        }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        setCanvasSize({ width, height });
      };

      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      window.addEventListener("resize", resize);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", resize);
      };
    }, []);

    const committedElements = useMemo(() => {
      if (!draftElement) {
        return Object.values(elements);
      }
      return Object.values(elements).filter((element) => element.id !== draftElement.id);
    }, [draftElement, elements]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      clearCanvas(ctx, canvasSize.width, canvasSize.height);
      drawElements(ctx, committedElements, draftElement ?? undefined);
    }, [canvasSize.height, canvasSize.width, committedElements, draftElement]);

    useImperativeHandle(
      ref,
      () => ({
        downloadPng: () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            return;
          }
          const url = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = url;
          link.download = `whiteboard-${Date.now()}.png`;
          link.click();
        },
        exportJson: () => {
          const content = JSON.stringify(elements, null, 2);
          const blob = new Blob([content], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `whiteboard-${Date.now()}.json`;
          link.click();
          URL.revokeObjectURL(url);
        },
        clearBoard: () => {
          onReplaceBoard({});
          setDraft(null);
        },
      }),
      [elements, onReplaceBoard, setDraft]
    );

    const remoteCursors = participants.filter(
      (participant) => participant.userId !== user.id && participant.cursor
    );

    return (
      <div ref={containerRef} className="v2-board-container">
        <canvas ref={canvasRef} className="v2-board-canvas" />
        <div className="v2-cursor-layer">
          {remoteCursors.map((participant) => {
            const cursor = participant.cursor;
            if (!cursor) {
              return null;
            }

            return (
              <div
                key={participant.socketId}
                className="v2-cursor"
                style={{
                  left: `${cursor.x}px`,
                  top: `${cursor.y}px`,
                  borderColor: participant.color,
                }}
              >
                <span style={{ backgroundColor: participant.color }}>
                  {participant.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

WhiteboardCanvas.displayName = "WhiteboardCanvas";

export default WhiteboardCanvas;
