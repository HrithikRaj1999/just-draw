export type DrawingTool =
  | "select"
  | "pen"
  | "eraser"
  | "line"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "db"
  | "server"
  | "client"
  | "computer"
  | "balancer"
  | "text"
  | "hand";

export type ShapeKind =
  | "line"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "db"
  | "server"
  | "client"
  | "computer"
  | "balancer";

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

export interface UserIdentity {
  id: string;
  name: string;
  color: string;
}
