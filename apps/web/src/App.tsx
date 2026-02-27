import { Suspense, lazy, useEffect, useState } from "react";

const WhiteboardApp = lazy(() => import("./v2/app/WhiteboardApp"));
const Landing = lazy(() => import("./v2/app/Landing"));

const App = () => {
  const [room, setRoom] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const roomParam = url.searchParams.get("room");
    if (roomParam && roomParam.trim() !== "") {
      setRoom(roomParam.trim());
    }
  }, []);

  return (
    <Suspense
      fallback={<main className="v2-loading">Loading application...</main>}
    >
      {room ? <WhiteboardApp /> : <Landing />}
    </Suspense>
  );
};

export default App;
