import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createId } from "../lib/identity";
import {
  clearCanvas,
  drawElements,
  getElementBounds,
  pointerFromEvent,
} from "../canvas/render";
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
  onDeleteElement: (elementId: string) => void;
  onReplaceBoard: (elements: Record<string, WhiteboardElement>) => void;
  onPresenceUpdate: (
    tool: DrawingTool,
    cursor?: { x: number; y: number },
  ) => void;
  onActionComplete?: () => void;
}

export interface WhiteboardCanvasHandle {
  downloadPng: () => void;
  exportJson: () => void;
  importJson: () => void;
  clearBoard: () => void;
}

const SHAPE_TOOLS = new Set<DrawingTool>([
  "line",
  "arrow",
  "rectangle",
  "ellipse",
  "db",
  "server",
  "client",
  "computer",
  "balancer",
]);

const isShapeTool = (tool: DrawingTool): tool is ShapeKind =>
  SHAPE_TOOLS.has(tool);

const cursorForTool = (tool: DrawingTool): string => {
  if (tool === "text") {
    return "text";
  }
  if (tool === "hand") {
    return "grab";
  }
  if (tool === "select") {
    return "default";
  }
  return "crosshair";
};

const WhiteboardCanvas = forwardRef<
  WhiteboardCanvasHandle,
  WhiteboardCanvasProps
>(
  (
    {
      tool,
      strokeColor,
      strokeSize,
      user,
      elements,
      participants,
      onUpsertElement,
      onDeleteElement,
      onReplaceBoard,
      onPresenceUpdate,
      onActionComplete,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const draftRef = useRef<WhiteboardElement | null>(null);
    const pointerActiveRef = useRef(false);
    const lastElementEmitRef = useRef(0);
    const lastPresenceEmitRef = useRef(0);

    const [draftElement, setDraftElement] = useState<WhiteboardElement | null>(
      null,
    );

    const [dragData, setDragData] = useState<{
      element: WhiteboardElement;
      startX: number;
      startY: number;
    } | null>(null);

    const [selectedElementId, setSelectedElementId] = useState<string | null>(
      null,
    );
    const [textPromptValue, setTextPromptValue] = useState("");

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
      [onPresenceUpdate, tool],
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
      [onUpsertElement],
    );

    const tryEraseElementAt = useCallback(
      (x: number, y: number) => {
        // iterate backwards to erase top-most element first
        const allElements = Object.values(elements);
        for (let i = allElements.length - 1; i >= 0; i--) {
          const element = allElements[i];
          const bounds = getElementBounds(element);
          // add 5px padding to make it easier to hit
          if (
            x >= bounds.left - 5 &&
            x <= bounds.left + bounds.width + 5 &&
            y >= bounds.top - 5 &&
            y <= bounds.top + bounds.height + 5
          ) {
            onDeleteElement(element.id);
            onActionComplete?.();
            return true; // only delete one matched element per check
          }
        }
        return false;
      },
      [elements, onDeleteElement, onActionComplete],
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
      [strokeColor, strokeSize, user.id],
    );

    const [textPromptData, setTextPromptData] = useState<{
      x: number;
      y: number;
      fontSize: number;
    } | null>(null);

    const handleTextSubmit = useCallback(
      (text: string) => {
        if (!textPromptData) return;
        if (text.trim().length > 0) {
          const now = Date.now();
          onUpsertElement({
            id: createId(),
            type: "text",
            createdBy: user.id,
            createdAt: now,
            updatedAt: now,
            position: {
              x: textPromptData.x,
              y: textPromptData.y,
              pressure: 0.5,
            },
            color: strokeColor,
            fontSize: textPromptData.fontSize,
            text: text.trim(),
          });
          onActionComplete?.();
        }
        setTextPromptData(null);
        setTextPromptValue("");
      },
      [textPromptData, user.id, strokeColor, onUpsertElement, onActionComplete],
    );

    const handlePointerDown = useCallback(
      (event: PointerEvent) => {
        if (textPromptData) {
          // If we click anywhere else, save the current text prompt
          handleTextSubmit(textPromptValue);
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }

        const point = pointerFromEvent(event, canvas);
        emitPresence(point.x, point.y, true);

        if (tool === "hand") {
          return;
        }

        if (tool === "select") {
          // Find topmost element clicked
          const allElements = Object.values(elements);
          for (let i = allElements.length - 1; i >= 0; i--) {
            const element = allElements[i];
            const bounds = getElementBounds(element);
            if (
              point.x >= bounds.left - 5 &&
              point.x <= bounds.left + bounds.width + 5 &&
              point.y >= bounds.top - 5 &&
              point.y <= bounds.top + bounds.height + 5
            ) {
              pointerActiveRef.current = true;
              canvas.setPointerCapture(event.pointerId);
              setDragData({
                element,
                startX: point.x,
                startY: point.y,
              });
              setSelectedElementId(element.id);
              return;
            }
          }
          setSelectedElementId(null);
          return; // nothing clicked
        }

        if (tool === "text") {
          setTextPromptData({
            x: point.x,
            y: point.y,
            fontSize: Math.max(14, strokeSize * 4),
          });
          return;
        }

        pointerActiveRef.current = true;
        canvas.setPointerCapture(event.pointerId);

        if (tool === "eraser") {
          tryEraseElementAt(point.x, point.y);
          return;
        }

        if (tool === "pen") {
          const stroke = createStrokeElement(point.x, point.y, false);
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
            fillColor:
              tool === "line" || tool === "arrow" ? undefined : "transparent",
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
        tryEraseElementAt,
        textPromptData,
        textPromptValue,
        handleTextSubmit,
        elements,
      ],
    );

    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }

        const point = pointerFromEvent(event, canvas);
        emitPresence(point.x, point.y);

        if (!pointerActiveRef.current) {
          return;
        }

        if (tool === "select" && dragData) {
          const dx = point.x - dragData.startX;
          const dy = point.y - dragData.startY;

          let moved = { ...dragData.element, updatedAt: Date.now() };

          if (moved.type === "shape") {
            moved.from = {
              ...moved.from,
              x: moved.from.x + dx,
              y: moved.from.y + dy,
            };
            moved.to = { ...moved.to, x: moved.to.x + dx, y: moved.to.y + dy };
          } else if (moved.type === "text") {
            moved.position = {
              ...moved.position,
              x: moved.position.x + dx,
              y: moved.position.y + dy,
            };
          } else if (moved.type === "stroke") {
            moved.points = moved.points.map((p) => ({
              ...p,
              x: p.x + dx,
              y: p.y + dy,
            }));
          }

          setDraft(moved);
          maybeBroadcastDraft(moved);
          return;
        }

        if (tool === "eraser") {
          tryEraseElementAt(point.x, point.y);
          return;
        }

        if (!draftRef.current) {
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
      [
        emitPresence,
        maybeBroadcastDraft,
        setDraft,
        tool,
        tryEraseElementAt,
        dragData,
      ],
    );

    const finalizeDraft = useCallback(() => {
      if (!pointerActiveRef.current) {
        return;
      }
      pointerActiveRef.current = false;

      if (tool === "select") {
        setDragData(null);
        if (draftRef.current) {
          onUpsertElement({ ...draftRef.current, updatedAt: Date.now() });
          setDraft(null);
          onActionComplete?.();
        }
        return;
      }

      if (!draftRef.current) {
        return;
      }

      const finalized: WhiteboardElement = {
        ...draftRef.current,
        updatedAt: Date.now(),
      };
      onUpsertElement(finalized);
      setDraft(null);
      onActionComplete?.();
    }, [onUpsertElement, setDraft, tool, onActionComplete]);

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

    const committedElements = useMemo(() => {
      if (!draftElement) {
        return Object.values(elements);
      }
      return Object.values(elements).filter(
        (element) => element.id !== draftElement.id,
      );
    }, [draftElement, elements]);

    const drawBoard = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      clearCanvas(ctx, canvas.width, canvas.height);
      drawElements(
        ctx,
        committedElements,
        draftElement ?? undefined,
        selectedElementId,
      );
    }, [committedElements, draftElement, selectedElementId]);

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

        // draw synchronously during the resize frame to prevent flashing
        drawBoard();
      };

      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      window.addEventListener("resize", resize);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", resize);
      };
    }, [drawBoard]);

    useEffect(() => {
      drawBoard();
    }, [drawBoard]);

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
        importJson: () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json,.json";
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) {
              return;
            }
            try {
              const text = await file.text();
              const parsed = JSON.parse(text);
              if (
                !parsed ||
                typeof parsed !== "object" ||
                Array.isArray(parsed)
              ) {
                window.alert("Invalid JSON board format.");
                return;
              }
              onReplaceBoard(parsed as Record<string, WhiteboardElement>);
              onActionComplete?.();
            } catch (error) {
              window.alert("Unable to import JSON file.");
              console.error(error);
            }
          };
          input.click();
        },
        clearBoard: () => {
          onReplaceBoard({});
          setDraft(null);
          onActionComplete?.();
        },
      }),
      [elements, onReplaceBoard, setDraft, onActionComplete],
    );

    const remoteCursors = participants.filter(
      (participant) => participant.userId !== user.id && participant.cursor,
    );

    return (
      <div ref={containerRef} className="v2-board-container">
        <canvas
          ref={canvasRef}
          className="v2-board-canvas"
          style={{ cursor: cursorForTool(tool) }}
        />
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

        {textPromptData && (
          <textarea
            autoFocus
            style={{
              position: "absolute",
              left: `${textPromptData.x}px`,
              top: `${textPromptData.y}px`,
              font: `${textPromptData.fontSize}px "Segoe UI", sans-serif`,
              color: strokeColor,
              margin: 0,
              padding: 0,
              border: "1px dashed var(--accent-color)",
              background: "transparent",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              whiteSpace: "pre",
              zIndex: 50,
              minWidth: "20px",
              minHeight: `${textPromptData.fontSize + 4}px`,
            }}
            value={textPromptValue}
            onChange={(e) => setTextPromptValue(e.target.value)}
            onBlur={() => handleTextSubmit(textPromptValue)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleTextSubmit(textPromptValue);
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
              target.style.width = "auto";
              target.style.width = `${Math.max(20, target.scrollWidth)}px`;
            }}
          />
        )}
      </div>
    );
  },
);

WhiteboardCanvas.displayName = "WhiteboardCanvas";

export default WhiteboardCanvas;
