import type { PresenceState, UserIdentity } from "../types/whiteboard";

interface ParticipantStripProps {
  participants: PresenceState[];
  user: UserIdentity;
  connected: boolean;
}

const getInitials = (name: string) => {
  return name.substring(0, 2).toUpperCase();
};

const ParticipantStrip = ({
  participants,
  user,
  connected,
}: ParticipantStripProps) => {
  return (
    <header className="v2-participants">
      <div className="v2-participants-title">
        <span className={connected ? "online" : "offline"}>
          {connected ? "Live" : "Reconnecting"}
        </span>
      </div>

      <div className="v2-participants-list">
        {participants.map((participant) => (
          <div
            key={participant.socketId}
            className="v2-participant-pill"
            style={{ backgroundColor: participant.color }}
          >
            {getInitials(participant.name)}
            <div className="tooltip-label">
              {participant.userId === user.id
                ? `${participant.name} (You)`
                : participant.name}
            </div>
          </div>
        ))}
      </div>
    </header>
  );
};

export default ParticipantStrip;
