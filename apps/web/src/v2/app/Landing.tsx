import { useEffect, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { getOrCreateUser, updateUserName } from "../lib/identity";

export default function Landing() {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const user = getOrCreateUser();
    setUserName(user.name);
  }, []);

  const handleJoin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (userName.trim()) {
      updateUserName(userName.trim());
    }
    if (roomId.trim()) {
      window.location.href = `/?room=${encodeURIComponent(roomId.trim())}`;
    }
  };

  const handleCreate = () => {
    if (userName.trim()) {
      updateUserName(userName.trim());
    }
    // Generate a random 6-digit style room ID
    const generated =
      Math.floor(100 + Math.random() * 900).toString() +
      "-" +
      Math.floor(100 + Math.random() * 900).toString();
    window.location.href = `/?room=${generated}`;
  };

  return (
    <main
      className="v2-shell"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "1.75rem",
              fontFamily: "var(--font-display)",
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            System Design
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            Premium technical interview platform
          </p>
        </div>

        <form
          onSubmit={handleJoin}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-main)",
            }}
          >
            YOUR NAME
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-canvas)",
                color: "var(--text-main)",
                fontSize: "1rem",
                fontFamily: "var(--font-sans)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </label>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-main)",
            }}
          >
            JOIN EXISTING SESSION
            <input
              type="text"
              placeholder="e.g. 123-456"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-canvas)",
                color: "var(--text-main)",
                fontSize: "1rem",
                fontFamily: "var(--font-sans)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
          </label>
          <button
            type="submit"
            disabled={!roomId.trim()}
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              background: roomId.trim()
                ? "var(--accent-color)"
                : "var(--border-color)",
              color: "white",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              cursor: roomId.trim() ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
          >
            Join Page <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "var(--border-color)",
            }}
          ></div>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Or
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "var(--border-color)",
            }}
          ></div>
        </div>

        <button
          onClick={handleCreate}
          style={{
            padding: "0.75rem",
            borderRadius: "8px",
            background: "transparent",
            border: "2px solid var(--border-color)",
            color: "var(--text-main)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <Plus size={16} /> Start New Session
        </button>
      </div>
    </main>
  );
}
