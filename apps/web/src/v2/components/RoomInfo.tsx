import { useState } from "react";
import { LinkIcon, Check } from "lucide-react";

interface RoomInfoProps {
  roomId: string;
  boardVersion: number;
}

const RoomInfo = ({ roomId }: RoomInfoProps) => {
  const [copied, setCopied] = useState(false);

  const copyInvite = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="v2-room-info glass-panel">
      <p className="page-title">Delineation</p>
      <p className="page-number">Page {roomId}</p>
      <button type="button" onClick={copyInvite}>
        {copied ? <Check size={16} /> : <LinkIcon size={16} />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </aside>
  );
};

export default RoomInfo;
