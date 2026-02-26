import { Suspense, lazy } from "react";

const WhiteboardApp = lazy(() => import("./v2/app/WhiteboardApp"));

const App = () => {
  return (
    <Suspense fallback={<main className="v2-loading">Loading application...</main>}>
      <WhiteboardApp />
    </Suspense>
  );
};

export default App;
