import dynamic from "next/dynamic";

const WhiteboardApp = dynamic(() => import("@/v2/app/WhiteboardApp"), {
  ssr: false,
  loading: () => <main className="v2-loading">Loading whiteboard...</main>,
});

export default function Home() {
  return <WhiteboardApp />;
}
