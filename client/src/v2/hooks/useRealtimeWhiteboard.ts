"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocketClient } from "../lib/socket";
import type {
  BoardState,
  DrawingTool,
  PresenceState,
  UserIdentity,
  WhiteboardElement,
} from "../types/whiteboard";

interface UseRealtimeWhiteboardParams {
  roomId: string;
  user: UserIdentity;
}

const toPresenceMap = (
  entries: PresenceState[]
): Record<string, PresenceState> => {
  return entries.reduce<Record<string, PresenceState>>((acc, entry) => {
    acc[entry.socketId] = entry;
    return acc;
  }, {});
};

interface ElementUpsertEvent {
  element: WhiteboardElement;
  version: number;
}

interface ElementDeleteEvent {
  elementId: string;
  version: number;
}

interface PresenceLeaveEvent {
  socketId: string;
}

export const useRealtimeWhiteboard = ({
  roomId,
  user,
}: UseRealtimeWhiteboardParams) => {
  const [connected, setConnected] = useState(false);
  const [boardVersion, setBoardVersion] = useState(0);
  const [elements, setElements] = useState<Record<string, WhiteboardElement>>(
    {}
  );
  const [presenceBySocketId, setPresenceBySocketId] = useState<
    Record<string, PresenceState>
  >({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocketClient();
    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
      socket.emit("room:join", {
        roomId,
        userId: user.id,
        name: user.name,
        color: user.color,
      });
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on("board:state", (board: BoardState) => {
      if (board.roomId !== roomId) {
        return;
      }
      setElements(board.elements ?? {});
      setBoardVersion(board.version);
    });

    socket.on("element:upsert", ({ element, version }: ElementUpsertEvent) => {
      if (!element?.id) {
        return;
      }
      setElements((prev) => ({
        ...prev,
        [element.id]: element,
      }));
      if (typeof version === "number") {
        setBoardVersion(version);
      }
    });

    socket.on("element:delete", ({ elementId, version }: ElementDeleteEvent) => {
      if (!elementId) {
        return;
      }
      setElements((prev) => {
        const next = { ...prev };
        delete next[elementId];
        return next;
      });
      if (typeof version === "number") {
        setBoardVersion(version);
      }
    });

    socket.on("presence:snapshot", (entries: PresenceState[]) => {
      setPresenceBySocketId(toPresenceMap(entries));
    });

    socket.on("presence:join", (presence: PresenceState) => {
      setPresenceBySocketId((prev) => ({
        ...prev,
        [presence.socketId]: presence,
      }));
    });

    socket.on("presence:update", (presence: PresenceState) => {
      setPresenceBySocketId((prev) => ({
        ...prev,
        [presence.socketId]: presence,
      }));
    });

    socket.on("presence:leave", ({ socketId }: PresenceLeaveEvent) => {
      if (!socketId) {
        return;
      }
      setPresenceBySocketId((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    socket.on("error:message", (message: string) => {
      console.warn("[whiteboard] socket error:", message);
    });

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("board:state");
      socket.off("element:upsert");
      socket.off("element:delete");
      socket.off("presence:snapshot");
      socket.off("presence:join");
      socket.off("presence:update");
      socket.off("presence:leave");
      socket.off("error:message");
    };
  }, [roomId, user.color, user.id, user.name]);

  const upsertElement = useCallback(
    (element: WhiteboardElement) => {
      setElements((prev) => ({
        ...prev,
        [element.id]: element,
      }));
      socketRef.current?.emit("element:upsert", { roomId, element });
    },
    [roomId]
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      setElements((prev) => {
        const next = { ...prev };
        delete next[elementId];
        return next;
      });
      socketRef.current?.emit("element:delete", { roomId, elementId });
    },
    [roomId]
  );

  const replaceBoard = useCallback(
    (nextElements: Record<string, WhiteboardElement>) => {
      setElements(nextElements);
      socketRef.current?.emit("board:replace", {
        roomId,
        elements: nextElements,
      });
    },
    [roomId]
  );

  const updatePresence = useCallback(
    (tool: DrawingTool, cursor?: { x: number; y: number }) => {
      socketRef.current?.emit("presence:update", {
        roomId,
        tool,
        cursor,
      });
    },
    [roomId]
  );

  const participants = useMemo(
    () => Object.values(presenceBySocketId),
    [presenceBySocketId]
  );

  return {
    connected,
    boardVersion,
    elements,
    participants,
    upsertElement,
    deleteElement,
    replaceBoard,
    updatePresence,
  };
};
