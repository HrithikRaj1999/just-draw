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
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "dark",
  );
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [strokeColor, setStrokeColor] = useState("#111827");
  const [strokeSize, setStrokeSize] = useState(4);
  const canvasRef = useRef<WhiteboardCanvasHandle | null>(null);

  const [history, setHistory] = useState<
    Array<{
      snapshot: string | null;
      elements: Record<string, WhiteboardElement>;
    }>
  >([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyInitialized = useRef(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    setSession({
      roomId: getOrCreateRoomId(),
      user: getOrCreateUser(),
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

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
      setTimeout(() => {
        const snapshot = canvasRef.current?.getSnapshot() || null;
        setHistory([{ snapshot, elements }]);
        setHistoryIndex(0);
        historyInitialized.current = true;
      }, 100);
    }
  }, [connected, elements]);

  const handleActionComplete = useCallback(() => {
    // Wait for the React component to draw to the invisible background layer
    setTimeout(() => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        const snapshot = canvasRef.current?.getSnapshot() || null;
        newHistory.push({ snapshot, elements: { ...elements } });
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    }, 50);
  }, [elements, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      replaceBoard(history[newIndex].elements);
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

  const handleClearHistory = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to delete all history? This cannot be undone.",
      )
    ) {
      setHistory([
        {
          snapshot: canvasRef.current?.getSnapshot() || null,
          elements: { ...elements },
        },
      ]);
      setHistoryIndex(0);
      setIsHistoryModalOpen(false);
    }
  }, [elements]);

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
            theme={theme}
            onToolChange={setTool}
            onStrokeColorChange={setStrokeColor}
            onStrokeSizeChange={setStrokeSize}
            onThemeToggle={() =>
              setTheme((t) => (t === "light" ? "dark" : "light"))
            }
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

          {/* Floating Minimized Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "8px 16px",
              zIndex: 100,
              boxShadow: "var(--glass-shadow)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-sans)",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--text-main)",
            }}
          >
            History & Undo ({historyIndex}/{Math.max(0, history.length - 1)})
          </button>

          {/* Centered Modal Overlay */}
          {isHistoryModalOpen && (
            <div
              className="v2-modal-backdrop"
              onClick={() => setIsHistoryModalOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(4px)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
              }}
            >
              <div
                className="v2-modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "16px",
                  width: "100%",
                  maxWidth: "800px",
                  maxHeight: "80vh",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "1.5rem",
                    borderBottom: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.25rem",
                      color: "var(--text-main)",
                    }}
                  >
                    Session History
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={handleClearHistory}
                      style={{
                        background: "var(--accent-color)",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        marginRight: "16px",
                        fontWeight: 500,
                      }}
                    >
                      Purge History
                    </button>
                    <button
                      onClick={() => setIsHistoryModalOpen(false)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1.5rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {history.map((snap, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setHistoryIndex(idx);
                          replaceBoard(snap.elements);
                          setIsHistoryModalOpen(false);
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background:
                            idx === historyIndex
                              ? "var(--glass-bg)"
                              : "transparent",
                          border: `2px solid ${idx === historyIndex ? "var(--accent-color)" : "var(--border-color)"}`,
                          borderRadius: "8px",
                          overflow: "hidden",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                          transition: "border-color 0.2s, transform 0.2s",
                          pointerEvents: "auto",
                        }}
                      >
                        <div
                          style={{
                            height: "120px",
                            width: "100%",
                            background: "var(--bg-canvas)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          {snap.snapshot ? (
                            <img
                              src={snap.snapshot}
                              alt={`Snapshot ${idx}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--text-muted)",
                              }}
                            >
                              No Image
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            padding: "0.5rem 0.75rem",
                            background:
                              idx === historyIndex
                                ? "var(--accent-color)"
                                : "transparent",
                            color:
                              idx === historyIndex
                                ? "white"
                                : "var(--text-main)",
                            width: "100%",
                          }}
                        >
                          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                            Step {idx}
                          </span>
                          {idx === 0 && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                opacity: 0.8,
                                marginLeft: "4px",
                              }}
                            >
                              (Start)
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    {history.length === 0 && (
                      <div
                        style={{ color: "var(--text-muted)", padding: "1rem" }}
                      >
                        No history yet. Draw something!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </Suspense>
    </main>
  );
};

export default WhiteboardApp;
