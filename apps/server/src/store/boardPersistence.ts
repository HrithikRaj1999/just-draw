import type { BoardState } from "../types/whiteboard";

export interface BoardPersistence {
  load(roomId: string): Promise<BoardState | null>;
  save(board: BoardState): Promise<void>;
}
