import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

type MouthExpression = "happy" | "surprised" | "small";
type LookDirection = "none" | "left" | "right";

interface FaceProps {
  expression?: MouthExpression;
  blobColor?: string;
  lookDirection?: LookDirection;
}

const MOUTH_CHARS: Record<MouthExpression, string> = {
  happy: "(",      // Smiley face curve (rotated)
  surprised: "o",  // Brief surprised
  small: "-",      // Brief small mouth
};

export function Face({ expression = "happy", blobColor = "#ff9a9e", lookDirection = "none" }: FaceProps) {
  const leftEyeRef = useRef<THREE.Object3D>(null);
  const rightEyeRef = useRef<THREE.Object3D>(null);
  const mouthRef = useRef<THREE.Object3D>(null);
  const groupRef = useRef<THREE.Group>(null);

  const [isBlinking, setIsBlinking] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<MouthExpression>(expression);

  const faceColor = "#9C454D";
  const isLooking = lookDirection !== "none";

  // Slightly lighter shade for blush
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
      if (!isLooking && Math.random() < 0.7) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 120);
      }
    }, 2500 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, [isLooking]);

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

  // Subtle idle animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.02;
  });

  // Determine eye character for normal/blinking states
  const getEyeChar = () => {
    if (isBlinking) return "─";
    return "^";
  };

  const eyeChar = getEyeChar();
  // Use "." mouth while looking, otherwise use current expression
  const mouthChar = isLooking ? "`" : MOUTH_CHARS[currentExpression];
  const mouthRotation = (!isLooking && currentExpression === "happy") ? Math.PI / 2 : 0;

  // Eye positions
  const leftEyeX = -0.25;
  const rightEyeX = 0.25;
  const eyeY = 0.15;

  // Eyebrow offset - move WITH the direction we're facing
  // Facing right -> eyebrows shift right, facing left -> eyebrows shift left
  const eyebrowOffset = lookDirection === "right" ? 0.03 : lookDirection === "left" ? -0.03 : 0;

  return (
    <group ref={groupRef} position={[0, 0.1, 1.12]}>
      {/* Eyes - different rendering when looking vs normal */}
      {isLooking ? (
        <>
          {/* Looking eyes: small filled circles with ( arch eyebrows */}
          {/* Left eye */}
          <mesh position={[leftEyeX, eyeY, 0]}>
            <circleGeometry args={[0.07, 16]} />
            <meshBasicMaterial color={faceColor} />
          </mesh>
          <Text
            position={[leftEyeX + eyebrowOffset, eyeY + 0.13, 0]}
            fontSize={0.18}
            color={faceColor}
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, -Math.PI / 2]}
          >
            (
          </Text>

          {/* Right eye */}
          <mesh position={[rightEyeX, eyeY, 0]}>
            <circleGeometry args={[0.07, 16]} />
            <meshBasicMaterial color={faceColor} />
          </mesh>
          <Text
            position={[rightEyeX + eyebrowOffset, eyeY + 0.13, 0]}
            fontSize={0.18}
            color={faceColor}
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, -Math.PI / 2]}
          >
            (
          </Text>
        </>
      ) : (
        <>
          {/* Normal eyes: ^ characters (or ─ when blinking) */}
          <Text
            ref={leftEyeRef as any}
            position={[leftEyeX, eyeY, 0]}
            fontSize={0.35}
            color={faceColor}
            anchorX="center"
            anchorY="middle"
          >
            {eyeChar}
          </Text>

          <Text
            ref={rightEyeRef as any}
            position={[rightEyeX, eyeY, 0]}
            fontSize={0.35}
            color={faceColor}
            anchorX="center"
            anchorY="middle"
          >
            {eyeChar}
          </Text>
        </>
      )}

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
