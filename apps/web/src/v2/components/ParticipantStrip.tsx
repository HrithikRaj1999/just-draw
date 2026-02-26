import type { PresenceState, UserIdentity } from "../types/whiteboard";

interface ParticipantStripProps {
  participants: PresenceState[];
  user: UserIdentity;
  connected: boolean;
}

const ParticipantStrip = ({
  participants,
  user,
  connected,
}: ParticipantStripProps) => {
  return (
    <header className="v2-participants">
      <div className="v2-participants-title">
        <strong>Realtime Board</strong>
        <span className={connected ? "online" : "offline"}>
          {connected ? "Online" : "Reconnecting"}
        </span>
      </div>

      <div className="v2-participants-list">
        {participants.map((participant) => (
          <div key={participant.socketId} className="v2-participant-pill">
            <i style={{ backgroundColor: participant.color }} />
            <span>
              {participant.userId === user.id ? `${participant.name} (You)` : participant.name}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
};

export default ParticipantStrip;
