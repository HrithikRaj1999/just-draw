import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BoardState } from "../types/whiteboard";
import type { BoardPersistence } from "./boardPersistence";

const sanitizeRoomId = (roomId: string): string => {
  return roomId.replace(/[^a-zA-Z0-9-_]/g, "_");
};

export class FileBoardPersistence implements BoardPersistence {
  constructor(private readonly baseDir: string) {}

  private filePath(roomId: string): string {
    return join(this.baseDir, `${sanitizeRoomId(roomId)}.json`);
  }

  public async load(roomId: string): Promise<BoardState | null> {
    try {
      const path = this.filePath(roomId);
      const data = await readFile(path, "utf8");
      const parsed = JSON.parse(data) as BoardState;
      if (!parsed?.roomId || !parsed?.elements) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  public async save(board: BoardState): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
    const path = this.filePath(board.roomId);
    await writeFile(path, JSON.stringify(board), "utf8");
  }
}
