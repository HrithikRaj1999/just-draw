import type {
  BoardState,
  PresenceState,
  WhiteboardElement,
} from "../types/whiteboard";
import type { BoardPersistence } from "./boardPersistence";
import { computePathData } from "../utils/stroke";

interface RoomRuntime {
  board: BoardState;
  hydrated: boolean;
  hydratePromise?: Promise<void>;
  presenceBySocketId: Map<string, PresenceState>;
  flushTimer?: NodeJS.Timeout;
}

const createEmptyBoard = (roomId: string): BoardState => ({
  roomId,
  version: 0,
  elements: {},
  updatedAt: Date.now(),
});

export class RoomRegistry {
  private readonly rooms = new Map<string, RoomRuntime>();

  constructor(
    private readonly persistence: BoardPersistence,
    private readonly autosaveDebounceMs: number,
  ) {}

  private ensureRuntime(roomId: string): RoomRuntime {
    const existing = this.rooms.get(roomId);
    if (existing) {
      return existing;
    }

    const runtime: RoomRuntime = {
      board: createEmptyBoard(roomId),
      hydrated: false,
      presenceBySocketId: new Map(),
    };

    this.rooms.set(roomId, runtime);
    return runtime;
  }

  private async hydrate(roomId: string): Promise<RoomRuntime> {
    const runtime = this.ensureRuntime(roomId);
    if (runtime.hydrated) {
      return runtime;
    }
    if (runtime.hydratePromise) {
      await runtime.hydratePromise;
      return runtime;
    }

    runtime.hydratePromise = (async () => {
      const stored = await this.persistence.load(roomId);
      if (stored) {
        runtime.board = stored;
      }
      runtime.hydrated = true;
      runtime.hydratePromise = undefined;
    })();

    await runtime.hydratePromise;
    return runtime;
  }

  private scheduleFlush(roomId: string): void {
    const runtime = this.ensureRuntime(roomId);
    if (runtime.flushTimer) {
      clearTimeout(runtime.flushTimer);
    }
    runtime.flushTimer = setTimeout(async () => {
      runtime.flushTimer = undefined;
      await this.persistence.save(runtime.board);
    }, this.autosaveDebounceMs);
  }

  private bumpVersion(runtime: RoomRuntime): BoardState {
    runtime.board = {
      ...runtime.board,
      version: runtime.board.version + 1,
      updatedAt: Date.now(),
    };
    this.scheduleFlush(runtime.board.roomId);
    return runtime.board;
  }

  public async getBoard(roomId: string): Promise<BoardState> {
    const runtime = await this.hydrate(roomId);
    return runtime.board;
  }

  public async upsertElement(
    roomId: string,
    element: WhiteboardElement,
  ): Promise<BoardState> {
    const runtime = await this.hydrate(roomId);

    // Server-side path calculation for newly drawn strokes
    if (
      element.type === "stroke" &&
      (!("pathData" in element) || !element.pathData)
    ) {
      element.pathData = computePathData(element.points, element.size);
    }

    runtime.board = {
      ...runtime.board,
      elements: {
        ...runtime.board.elements,
        [element.id]: element,
      },
    };
    return this.bumpVersion(runtime);
  }

  public async deleteElement(
    roomId: string,
    elementId: string,
  ): Promise<BoardState> {
    const runtime = await this.hydrate(roomId);
    const nextElements = { ...runtime.board.elements };
    delete nextElements[elementId];
    runtime.board = {
      ...runtime.board,
      elements: nextElements,
    };
    return this.bumpVersion(runtime);
  }

  public async replaceBoard(
    roomId: string,
    elements: Record<string, WhiteboardElement>,
  ): Promise<BoardState> {
    const runtime = await this.hydrate(roomId);
    runtime.board = {
      ...runtime.board,
      elements,
    };
    return this.bumpVersion(runtime);
  }

  public async setPresence(
    roomId: string,
    socketId: string,
    presence: PresenceState,
  ): Promise<PresenceState[]> {
    const runtime = await this.hydrate(roomId);
    runtime.presenceBySocketId.set(socketId, presence);
    return this.getPresence(roomId);
  }

  public getPresence(roomId: string): PresenceState[] {
    const runtime = this.ensureRuntime(roomId);
    return Array.from(runtime.presenceBySocketId.values());
  }

  public removePresence(roomId: string, socketId: string): PresenceState[] {
    const runtime = this.ensureRuntime(roomId);
    runtime.presenceBySocketId.delete(socketId);
    return this.getPresence(roomId);
  }
}
