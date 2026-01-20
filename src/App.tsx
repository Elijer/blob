import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { BlobMascot } from "./components/BlobMascot";
import { Environment } from "./components/Environment";
import "./App.css";

function App() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Environment />
          <BlobMascot position={[0, 0, 0]} />
          {/* Smaller companion blobs */}
          <BlobMascot position={[-2.5, -0.8, -1]} scale={0.4} color="#7eb8da" />
          <BlobMascot position={[2.2, 0.5, -0.5]} scale={0.35} color="#f5a6c9" />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
