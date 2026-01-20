import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

type MouthExpression = "happy" | "excited" | "surprised" | "neutral" | "small" | "dot";
type EyeState = "open" | "closed" | "squint" | "round";

interface FaceProps {
  expression?: MouthExpression;
  blobColor?: string;
}

const MOUTH_CHARS: Record<MouthExpression, string> = {
  happy: "(",      // Smiley face curve
  excited: "D",    // Big grin (will be rotated)
  surprised: "o",  // Round mouth
  neutral: "─",    // Flat line
  small: "-",      // Small dash
  dot: ".",        // Tiny dot
};

const EYE_CHARS: Record<EyeState, string> = {
  open: "^",       // Happy eyes
  closed: "─",     // Blinking
  squint: "≈",     // Squinty
  round: "o",      // Round curious eyes
};

// Derive a darker shade from the blob color for the face features
function getDarkerShade(hexColor: string, factor: number = 0.35): string {
  const color = new THREE.Color(hexColor);
  // Darken the color by reducing its lightness
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  // Make it darker and slightly more saturated
  hsl.l = hsl.l * factor;
  hsl.s = Math.min(1, hsl.s * 1.2);
  color.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${color.getHexString()}`;
}

export function Face({ expression = "happy", blobColor = "#ff9a9e" }: FaceProps) {
  const leftEyeRef = useRef<THREE.Object3D>(null);
  const rightEyeRef = useRef<THREE.Object3D>(null);
  const mouthRef = useRef<THREE.Object3D>(null);
  const groupRef = useRef<THREE.Group>(null);

  const [eyeState, setEyeState] = useState<EyeState>("open");
  const [currentExpression, setCurrentExpression] = useState<MouthExpression>(expression);

  // Compute darker shade for face features
  // const faceColor = useMemo(() => getDarkerShade(blobColor, 0.3), [blobColor]);
  const faceColor = "#9C454D"

  // Slightly lighter shade for blush (tinted toward pink)
  const blushColor = useMemo(() => {
    const color = new THREE.Color(blobColor);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    // Shift toward pink/red and make lighter
    color.setHSL(hsl.h * 0.95, Math.min(1, hsl.s * 1.3), Math.min(0.75, hsl.l * 1.2));
    return `#${color.getHexString()}`;
  }, [blobColor]);

  // Blinking and eye state logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.6) {
        // Normal blink
        setEyeState("closed");
        setTimeout(() => setEyeState("open"), 120);
      } else if (rand < 0.75) {
        // Occasional round curious eyes
        setEyeState("round");
        setTimeout(() => setEyeState("open"), 800 + Math.random() * 600);
      } else if (rand < 0.85) {
        // Occasional squint
        setEyeState("squint");
        setTimeout(() => setEyeState("open"), 500 + Math.random() * 400);
      }
      // Otherwise stay as-is
    }, 2500 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, []);

  // Randomly change mouth expression occasionally
  useEffect(() => {
    const expressionInterval = setInterval(() => {
      const expressions: MouthExpression[] = ["happy", "excited", "surprised", "neutral", "small", "dot"];
      const weights = [0.40, 0.18, 0.12, 0.10, 0.12, 0.08]; // Mostly happy, occasional variety
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

  // Rotation for certain mouth expressions
  const getMouthRotation = () => {
    switch (currentExpression) {
      case "excited": return -Math.PI / 2;  // Rotate D to be sideways grin
      case "happy": return Math.PI / 2;     // Rotate ( to be a smile
      default: return 0;
    }
  };
  const mouthRotation = getMouthRotation();

  return (
    // Pushed further forward (z=1.12) to stay in front of blob deformations
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
        fontSize={currentExpression === "excited" ? 0.45 : 0.3}
        color={faceColor}
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, mouthRotation]}
      >
        {mouthChar}
      </Text>

      {/* Blush marks (optional cute detail) */}
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
