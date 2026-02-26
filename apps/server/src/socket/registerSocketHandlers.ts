import type { Server, Socket } from "socket.io";
import { RoomRegistry } from "../store/roomRegistry";
import type {
  DeleteElementPayload,
  JoinRoomPayload,
  PresencePayload,
  PresenceState,
  ReplaceBoardPayload,
  UpsertElementPayload,
  WhiteboardElement,
} from "../types/whiteboard";

const DEFAULT_TOOL = "pen";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isValidElement = (element: unknown): element is WhiteboardElement => {
  if (!isObject(element)) {
    return false;
  }
  return (
    isNonEmptyString(element.id) &&
    isNonEmptyString(element.type) &&
    isNonEmptyString(element.createdBy)
  );
};

export const registerSocketHandlers = (
  io: Server,
  roomRegistry: RoomRegistry
): void => {
  io.on("connection", (socket: Socket) => {
    let currentRoomId = "";
    let currentUserId = "";

    socket.on("room:join", async (payload: JoinRoomPayload) => {
      if (
        !isObject(payload) ||
        !isNonEmptyString(payload.roomId) ||
        !isNonEmptyString(payload.userId) ||
        !isNonEmptyString(payload.name)
      ) {
        socket.emit("error:message", "Invalid room join payload.");
        return;
      }

      currentRoomId = payload.roomId;
      currentUserId = payload.userId;
      socket.join(currentRoomId);

      const board = await roomRegistry.getBoard(currentRoomId);
      const selfPresence: PresenceState = {
        socketId: socket.id,
        userId: payload.userId,
        name: payload.name,
        color: payload.color || "#3B82F6",
        tool: DEFAULT_TOOL,
        updatedAt: Date.now(),
      };

      const allPresence = await roomRegistry.setPresence(
        currentRoomId,
        socket.id,
        selfPresence
      );

      socket.emit("room:joined", {
        roomId: currentRoomId,
        socketId: socket.id,
        version: board.version,
      });
      socket.emit("board:state", board);
      socket.emit("presence:snapshot", allPresence);
      socket.to(currentRoomId).emit("presence:join", selfPresence);
    });

    socket.on("presence:update", async (payload: PresencePayload) => {
      if (
        !currentRoomId ||
        !isObject(payload) ||
        payload.roomId !== currentRoomId
      ) {
        return;
      }
      const prev = roomRegistry
        .getPresence(currentRoomId)
        .find((presence) => presence.socketId === socket.id);

      if (!prev) {
        return;
      }

      const updated: PresenceState = {
        ...prev,
        tool: payload.tool ?? prev.tool,
        cursor: payload.cursor ?? prev.cursor,
        updatedAt: Date.now(),
      };

      await roomRegistry.setPresence(currentRoomId, socket.id, updated);
      socket.to(currentRoomId).emit("presence:update", updated);
    });

    socket.on("element:upsert", async (payload: UpsertElementPayload) => {
      if (
        !currentRoomId ||
        !isObject(payload) ||
        payload.roomId !== currentRoomId ||
        !isValidElement(payload.element)
      ) {
        return;
      }

      const nextBoard = await roomRegistry.upsertElement(
        currentRoomId,
        payload.element
      );

      socket.to(currentRoomId).emit("element:upsert", {
        element: payload.element,
        version: nextBoard.version,
      });
    });

    socket.on("element:delete", async (payload: DeleteElementPayload) => {
      if (
        !currentRoomId ||
        !isObject(payload) ||
        payload.roomId !== currentRoomId ||
        !isNonEmptyString(payload.elementId)
      ) {
        return;
      }

      const nextBoard = await roomRegistry.deleteElement(
        currentRoomId,
        payload.elementId
      );
      socket.to(currentRoomId).emit("element:delete", {
        elementId: payload.elementId,
        version: nextBoard.version,
      });
    });

    socket.on("board:replace", async (payload: ReplaceBoardPayload) => {
      if (
        !currentRoomId ||
        !isObject(payload) ||
        payload.roomId !== currentRoomId ||
        !isObject(payload.elements)
      ) {
        return;
      }

      const nextBoard = await roomRegistry.replaceBoard(
        currentRoomId,
        payload.elements
      );
      io.to(currentRoomId).emit("board:state", nextBoard);
    });

    socket.on("disconnect", () => {
      if (!currentRoomId) {
        return;
      }

      roomRegistry.removePresence(currentRoomId, socket.id);
      socket.to(currentRoomId).emit("presence:leave", {
        socketId: socket.id,
        userId: currentUserId,
      });
    });
  });
};
