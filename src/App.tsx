import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { BlobMascot } from "./components/BlobMascot";
import { Environment } from "./components/Environment";
import "./App.css";

function App() {
  const [showBackground, setShowBackground] = useState(true);

  useEffect(() => {
    if (showBackground) {
      document.body.classList.add("with-background");
      document.body.classList.remove("no-background");
    } else {
      document.body.classList.add("no-background");
      document.body.classList.remove("with-background");
    }

    return () => {
      document.body.classList.remove("with-background", "no-background");
    };
  }, [showBackground]);

  return (
    <>
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <Environment />
            <BlobMascot position={[0, 0, 0]} showBackground={showBackground} />
          </Suspense>
        </Canvas>
      </div>
      <button
        className="background-toggle"
        onClick={() => setShowBackground(!showBackground)}
        aria-label="Toggle background gradient"
      >
        {showBackground ? "Hide BG" : "Show BG"}
      </button>
    </>
  );
}

export default App;
