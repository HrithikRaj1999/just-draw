"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { getOrCreateRoomId, getOrCreateUser } from "../lib/identity";
import { useRealtimeWhiteboard } from "../hooks/useRealtimeWhiteboard";
import type { DrawingTool, UserIdentity } from "../types/whiteboard";
import type { WhiteboardCanvasHandle } from "../components/WhiteboardCanvas";

const WhiteboardCanvas = dynamic(
  () => import("../components/WhiteboardCanvas"),
  { ssr: false }
);
const Toolbar = dynamic(() => import("../components/Toolbar"), { ssr: false });
const ParticipantStrip = dynamic(
  () => import("../components/ParticipantStrip"),
  { ssr: false }
);
const RoomInfo = dynamic(() => import("../components/RoomInfo"), { ssr: false });

interface SessionState {
  roomId: string;
  user: UserIdentity;
}

const WhiteboardApp = () => {
  const [session, setSession] = useState<SessionState | null>(null);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [strokeColor, setStrokeColor] = useState("#111827");
  const [strokeSize, setStrokeSize] = useState(4);
  const canvasRef = useRef<WhiteboardCanvasHandle | null>(null);

  useEffect(() => {
    setSession({
      roomId: getOrCreateRoomId(),
      user: getOrCreateUser(),
    });
  }, []);

  const roomId = session?.roomId ?? "";
  const user = session?.user;

  const {
    connected,
    boardVersion,
    elements,
    participants,
    upsertElement,
    replaceBoard,
    updatePresence,
  } = useRealtimeWhiteboard({
    roomId,
    user: user ?? {
      id: "loading",
      name: "Loading",
      color: "#2563EB",
    },
  });

  useEffect(() => {
    if (!session) {
      return;
    }
    updatePresence(tool);
  }, [session, tool, updatePresence]);

  if (!session || !user) {
    return <main className="v2-loading">Preparing whiteboard...</main>;
  }

  return (
    <main className="v2-shell">
      <ParticipantStrip
        participants={participants}
        connected={connected}
        user={user}
      />

      <section className="v2-stage">
        <Toolbar
          tool={tool}
          strokeColor={strokeColor}
          strokeSize={strokeSize}
          onToolChange={setTool}
          onStrokeColorChange={setStrokeColor}
          onStrokeSizeChange={setStrokeSize}
          onClear={() => canvasRef.current?.clearBoard()}
          onDownload={() => canvasRef.current?.downloadPng()}
          onExportJson={() => canvasRef.current?.exportJson()}
        />

        <WhiteboardCanvas
          ref={canvasRef}
          tool={tool}
          strokeColor={strokeColor}
          strokeSize={strokeSize}
          user={user}
          elements={elements}
          participants={participants}
          onUpsertElement={upsertElement}
          onReplaceBoard={replaceBoard}
          onPresenceUpdate={updatePresence}
        />

        <RoomInfo roomId={roomId} boardVersion={boardVersion} />
      </section>
    </main>
  );
};

export default WhiteboardApp;
