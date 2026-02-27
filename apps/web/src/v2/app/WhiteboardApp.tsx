import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { getOrCreateRoomId, getOrCreateUser } from "../lib/identity";
import { useRealtimeWhiteboard } from "../hooks/useRealtimeWhiteboard";
import type {
  DrawingTool,
  UserIdentity,
  WhiteboardElement,
} from "../types/whiteboard";
import type { WhiteboardCanvasHandle } from "../components/WhiteboardCanvas";

const WhiteboardCanvas = lazy(() => import("../components/WhiteboardCanvas"));
const Toolbar = lazy(() => import("../components/Toolbar"));
const ParticipantStrip = lazy(() => import("../components/ParticipantStrip"));
const RoomInfo = lazy(() => import("../components/RoomInfo"));

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

  const [history, setHistory] = useState<
    Array<Record<string, WhiteboardElement>>
  >([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyInitialized = useRef(false);

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
    deleteElement,
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
    if (
      connected &&
      !historyInitialized.current &&
      Object.keys(elements).length > 0
    ) {
      setHistory([elements]);
      setHistoryIndex(0);
      historyInitialized.current = true;
    }
  }, [connected, elements]);

  const handleActionComplete = useCallback(() => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...elements });
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [elements, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      replaceBoard(history[newIndex]);
    }
  }, [history, historyIndex, replaceBoard]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (!e.shiftKey) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo]);

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
      <Suspense
        fallback={<main className="v2-loading">Loading whiteboard...</main>}
      >
        <section className="v2-stage">
          <ParticipantStrip
            participants={participants}
            connected={connected}
            user={user}
          />

          <Toolbar
            tool={tool}
            strokeColor={strokeColor}
            strokeSize={strokeSize}
            roomId={roomId}
            onToolChange={setTool}
            onStrokeColorChange={setStrokeColor}
            onStrokeSizeChange={setStrokeSize}
            onClear={() => canvasRef.current?.clearBoard()}
            onDownload={() => canvasRef.current?.downloadPng()}
            onExportJson={() => canvasRef.current?.exportJson()}
            onImportJson={() => canvasRef.current?.importJson()}
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
            onDeleteElement={deleteElement}
            onReplaceBoard={replaceBoard}
            onPresenceUpdate={updatePresence}
            onActionComplete={handleActionComplete}
          />

          <RoomInfo roomId={roomId} boardVersion={boardVersion} />

          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              background: "var(--bg-canvas)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "10px",
              maxHeight: "300px",
              overflowY: "auto",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              pointerEvents: "auto",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "12px",
                color: "var(--text-main)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              History Stack
            </h3>
            {history.map((snap, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setHistoryIndex(idx);
                  replaceBoard(snap);
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  background:
                    idx === historyIndex
                      ? "var(--accent-color)"
                      : "transparent",
                  color: idx === historyIndex ? "white" : "var(--text-main)",
                }}
              >
                Snapshot {idx} {idx === 0 && "(Initial)"}
              </button>
            ))}
            {history.length === 0 && (
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                No history
              </div>
            )}
          </div>
        </section>
      </Suspense>
    </main>
  );
};

export default WhiteboardApp;
