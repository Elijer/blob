import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

type MouthExpression = "happy" | "surprised" | "small";
type EyeState = "open" | "closed" | "looking";

interface FaceProps {
  expression?: MouthExpression;
  blobColor?: string;
}

const MOUTH_CHARS: Record<MouthExpression, string> = {
  happy: "(",      // Smiley face curve (rotated)
  surprised: "o",  // Brief surprised
  small: "-",      // Brief small mouth
};

const EYE_CHARS: Record<EyeState, string> = {
  open: "^",       // Happy eyes (default)
  closed: "─",     // Blinking
  looking: "o",    // Round eyes when turning head
};

export function Face({ expression = "happy", blobColor = "#ff9a9e" }: FaceProps) {
  const leftEyeRef = useRef<THREE.Object3D>(null);
  const rightEyeRef = useRef<THREE.Object3D>(null);
  const mouthRef = useRef<THREE.Object3D>(null);
  const groupRef = useRef<THREE.Group>(null);

  const [eyeState, setEyeState] = useState<EyeState>("open");
  const [currentExpression, setCurrentExpression] = useState<MouthExpression>(expression);
  const [headTurnDirection, setHeadTurnDirection] = useState<"none" | "left" | "right">("none");
  const [targetRotation, setTargetRotation] = useState(0);

  const faceColor = "#9C454D";

  // Slightly lighter shade for blush (tinted toward pink)
  const blushColor = useMemo(() => {
    const color = new THREE.Color(blobColor);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    color.setHSL(hsl.h * 0.95, Math.min(1, hsl.s * 1.3), Math.min(0.75, hsl.l * 1.2));
    return `#${color.getHexString()}`;
  }, [blobColor]);

  // Blinking logic (only when not looking around)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (headTurnDirection === "none" && Math.random() < 0.7) {
        setEyeState("closed");
        setTimeout(() => setEyeState("open"), 120);
      }
    }, 2500 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, [headTurnDirection]);

  // Brief mouth expression changes (very occasional, very brief)
  useEffect(() => {
    const expressionInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        const brief = Math.random() < 0.5 ? "surprised" : "small";
        setCurrentExpression(brief);
        setTimeout(() => setCurrentExpression("happy"), 200 + Math.random() * 150);
      }
    }, 5000 + Math.random() * 3000);

    return () => clearInterval(expressionInterval);
  }, []);

  // Head turn animation every ~8 seconds
  useEffect(() => {
    const headTurnInterval = setInterval(() => {
      // Decide direction: left or right
      const direction = Math.random() < 0.5 ? "left" : "right";
      setHeadTurnDirection(direction);
      setEyeState("looking"); // Eyes become "o o" when turning
      setTargetRotation(direction === "left" ? 0.3 : -0.3);

      // Hold the look for a moment, then return to center
      setTimeout(() => {
        setTargetRotation(0);
        setTimeout(() => {
          setHeadTurnDirection("none");
          setEyeState("open"); // Back to "^ ^"
        }, 1500);
      }, 2000);
    }, 8000 + Math.random() * 2000);

    return () => clearInterval(headTurnInterval);
  }, []);

  // Animate head rotation smoothly
  useFrame(({ clock, pointer }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    // Smooth head turn rotation (Y-axis for left/right turn)
    const currentYRot = groupRef.current.rotation.y;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(currentYRot, targetRotation, 0.03);

    // Subtle idle wobble on Z
    groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.02;

    // Subtle position offset based on mouse (only when not turning)
    if (headTurnDirection === "none") {
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
    }
  });

  const eyeChar = EYE_CHARS[eyeState];
  const mouthChar = MOUTH_CHARS[currentExpression];

  // Rotation for mouth
  const mouthRotation = currentExpression === "happy" ? Math.PI / 2 : 0;

  return (
    <group ref={groupRef} position={[0, 0.1, 1.12]}>
      {/* Left Eye */}
      <Text
        ref={leftEyeRef as any}
        position={[-0.25, 0.15, 0]}
        fontSize={0.35}
        color={faceColor}
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
        color={faceColor}
        anchorX="center"
        anchorY="middle"
      >
        {eyeChar}
      </Text>

      {/* Mouth */}
      <Text
        ref={mouthRef as any}
        position={[0, -0.2, 0]}
        fontSize={0.3}
        color={faceColor}
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, mouthRotation]}
      >
        {mouthChar}
      </Text>

      {/* Blush marks */}
      <mesh position={[-0.45, -0.05, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color={blushColor} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.45, -0.05, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color={blushColor} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
