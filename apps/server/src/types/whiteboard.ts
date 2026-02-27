export type DrawingTool =
  | "select"
  | "pen"
  | "eraser"
  | "line"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "text"
  | "hand";

export type ShapeKind = "line" | "arrow" | "rectangle" | "ellipse";

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface BaseElement {
  id: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface StrokeElement extends BaseElement {
  type: "stroke";
  points: Point[];
  color: string;
  size: number;
  eraser?: boolean;
  pathData?: string;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: ShapeKind;
  from: Point;
  to: Point;
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
}

export interface TextElement extends BaseElement {
  type: "text";
  position: Point;
  color: string;
  fontSize: number;
  text: string;
}

export type WhiteboardElement = StrokeElement | ShapeElement | TextElement;

export interface BoardState {
  roomId: string;
  version: number;
  elements: Record<string, WhiteboardElement>;
  updatedAt: number;
}

export interface PresenceState {
  socketId: string;
  userId: string;
  name: string;
  color: string;
  tool: DrawingTool;
  cursor?: Point;
  updatedAt: number;
}

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
  name: string;
  color: string;
}

export interface PresencePayload {
  roomId: string;
  tool?: DrawingTool;
  cursor?: Point;
}

export interface UpsertElementPayload {
  roomId: string;
  element: WhiteboardElement;
}

export interface DeleteElementPayload {
  roomId: string;
  elementId: string;
}

export interface ReplaceBoardPayload {
  roomId: string;
  elements: Record<string, WhiteboardElement>;
}
