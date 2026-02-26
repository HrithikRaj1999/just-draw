interface RoomInfoProps {
  roomId: string;
  boardVersion: number;
}

const RoomInfo = ({ roomId, boardVersion }: RoomInfoProps) => {
  const copyInvite = async () => {
    if (typeof window === "undefined") {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    await navigator.clipboard.writeText(url.toString());
  };

  return (
    <aside className="v2-room-info">
      <p>
        Room <b>{roomId}</b>
      </p>
      <p>
        Version <b>{boardVersion}</b>
      </p>
      <button type="button" onClick={copyInvite}>
        Copy Invite Link
      </button>
    </aside>
  );
};

export default RoomInfo;
