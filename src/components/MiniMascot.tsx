import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { BlobMascot } from "./BlobMascot";
import { Environment } from "./Environment";

interface MiniMascotProps {
  visible: boolean;
}

export function MiniMascot({ visible }: MiniMascotProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "-120px",
        right: "210px",
        width: "550px",
        height: "680px",
        pointerEvents: "none",
        zIndex: 2147483646,
        animation: "miniMascotFadeIn 0.4s ease-out",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent", pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <Environment />
          <BlobMascot position={[0, -0.4, 0]} scale={0.6} isSmooth={true} textFontSize={0.032} />
        </Suspense>
      </Canvas>
    </div>
  );
}
