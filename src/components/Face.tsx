import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

type MouthExpression = "happy" | "excited" | "surprised" | "neutral";
type EyeState = "open" | "closed" | "squint";

interface FaceProps {
  expression?: MouthExpression;
}

const MOUTH_CHARS: Record<MouthExpression, string> = {
  happy: "‿",      // Curved smile
  excited: "D",    // Big grin (will be rotated)
  surprised: "o",  // Round mouth
  neutral: "─",    // Flat line
};

const EYE_CHARS: Record<EyeState, string> = {
  open: "^",       // Happy eyes
  closed: "─",     // Blinking
  squint: "≈",     // Squinty
};

export function Face({ expression = "happy" }: FaceProps) {
  const leftEyeRef = useRef<THREE.Object3D>(null);
  const rightEyeRef = useRef<THREE.Object3D>(null);
  const mouthRef = useRef<THREE.Object3D>(null);
  const groupRef = useRef<THREE.Group>(null);

  const [eyeState, setEyeState] = useState<EyeState>("open");
  const [currentExpression, setCurrentExpression] = useState<MouthExpression>(expression);

  // Blinking logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      // Random blink every 2-5 seconds
      if (Math.random() > 0.3) {
        setEyeState("closed");
        setTimeout(() => setEyeState("open"), 120); // Quick blink
      }
    }, 2500 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, []);

  // Randomly change expression occasionally
  useEffect(() => {
    const expressionInterval = setInterval(() => {
      const expressions: MouthExpression[] = ["happy", "excited", "surprised", "neutral"];
      const weights = [0.5, 0.25, 0.15, 0.1]; // Mostly happy
      const random = Math.random();
      let cumulative = 0;
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
          setCurrentExpression(expressions[i]);
          break;
        }
      }
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(expressionInterval);
  }, []);

  // Subtle face tracking / following effect
  useFrame(({ clock, pointer }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    // Subtle idle wobble
    groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.02;

    // Subtle look-at effect based on mouse (if pointer is available)
    const targetX = pointer.x * 0.05;
    const targetY = pointer.y * 0.05;

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      0.05
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY + 0.1,
      0.05
    );
  });

  const eyeChar = EYE_CHARS[eyeState];
  const mouthChar = MOUTH_CHARS[currentExpression];

  // Position for excited mouth (rotated D)
  const mouthRotation = currentExpression === "excited" ? -Math.PI / 2 : 0;

  return (
    <group ref={groupRef} position={[0, 0.1, 0.95]}>
      {/* Left Eye */}
      <Text
        ref={leftEyeRef as any}
        position={[-0.25, 0.15, 0]}
        fontSize={0.35}
        color="#2d2d2d"
        anchorX="center"
        anchorY="middle"
      >
        {eyeChar}
      </Text>

      {/* Right Eye */}
      <Text
        ref={rightEyeRef as any}
        position={[0.25, 0.15, 0]}
        fontSize={0.35}
        color="#2d2d2d"
        anchorX="center"
        anchorY="middle"
      >
        {eyeChar}
      </Text>

      {/* Mouth */}
      <Text
        ref={mouthRef as any}
        position={[0, -0.2, 0]}
        fontSize={currentExpression === "excited" ? 0.45 : 0.3}
        color="#2d2d2d"
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, mouthRotation]}
      >
        {mouthChar}
      </Text>

      {/* Blush marks (optional cute detail) */}
      <mesh position={[-0.45, -0.05, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color="#ffb3ba" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.45, -0.05, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color="#ffb3ba" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
