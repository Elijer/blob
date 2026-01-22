import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { Text } from "@react-three/drei";
import { BlobMascot } from "./components/BlobMascot";
import { Environment } from "./components/Environment";
import "./App.css";

// Hidden text to preload the font immediately
function FontPreloader() {
  return (
    <Text
      position={[0, 0, -1000]}
      fontSize={0.001}
      font="./fonts/RobotoMono-Regular.ttf"
      fillOpacity={0}
    >
      preload
    </Text>
  );
}

function App() {
  const [showBackground, setShowBackground] = useState(true);
  const [isSmooth, setIsSmooth] = useState(true);

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
            <FontPreloader />
            <Environment />
            <BlobMascot position={[0, 0, 0]} showBackground={showBackground} isSmooth={isSmooth} />
          </Suspense>
        </Canvas>
      </div>
      <div className="button-container">
        <button
          className="background-toggle"
          onClick={() => setShowBackground(!showBackground)}
          aria-label="Toggle background gradient"
        >
          {showBackground ? "Hide BG" : "Show BG"}
        </button>
        <button
          className="background-toggle"
          onClick={() => setIsSmooth(!isSmooth)}
          aria-label="Toggle smooth blob"
        >
          {isSmooth ? "Rough" : "Smooth"}
        </button>
      </div>
    </>
  );
}

export default App;
