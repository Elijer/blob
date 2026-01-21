import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface NotificationPanelProps {
  visible: boolean;
}

const CODE_LINES = [
  "26 viable oocytes discovered",
  "scanning for viability...",
  "triggering protocol initiated",
  "contacting remote lab",
  "progesterone levels: nominal",
  "estradiol: 2,847 pg/mL",
  "follicle count: 14",
  "LH surge detected",
  "scheduling retrieval",
  "syncing with fertility center",
  "ultrasound data received",
  "cycle day: 12",
  "endometrial thickness: 9.2mm",
  "transferring records...",
  "patient notified",
];

const LINE_HEIGHT = 0.07;
const VISIBLE_LINES = 7;
const TEXT_COLOR = "#FFFFFF";

export function NotificationPanel({ visible }: NotificationPanelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [lines, setLines] = useState<string[]>(() => {
    // Initialize with some lines
    const startIdx = Math.floor(Math.random() * CODE_LINES.length);
    const initialLines: string[] = [];
    for (let i = 0; i < 3; i++) {
      initialLines.push(CODE_LINES[(startIdx + i) % CODE_LINES.length]);
    }
    return initialLines;
  });
  const opacityRef = useRef(0);
  const scrollOffset = useRef(0);
  const lastLineTime = useRef(0);
  const [, forceUpdate] = useState(0);

  // Reset lines when becoming visible
  useEffect(() => {
    if (visible) {
      const startIdx = Math.floor(Math.random() * CODE_LINES.length);
      const initialLines: string[] = [];
      for (let i = 0; i < 3; i++) {
        initialLines.push(CODE_LINES[(startIdx + i) % CODE_LINES.length]);
      }
      setLines(initialLines);
      scrollOffset.current = 0;
      lastLineTime.current = 0;
    }
  }, [visible]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Fade in/out
    const targetOpacity = visible ? 1 : 0;
    let newOpacity = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, 0.1);

    // Snap to exactly 0 when fading out and close enough
    if (!visible && newOpacity < 0.05) {
      newOpacity = 0;
    }

    // Update when opacity changes
    if (Math.abs(newOpacity - opacityRef.current) > 0.001 || (opacityRef.current > 0 && newOpacity === 0)) {
      opacityRef.current = newOpacity;
      forceUpdate((n) => n + 1);
    }

    // Add new lines periodically when visible
    if (visible && time - lastLineTime.current > 0.8) {
      lastLineTime.current = time;
      setLines((prev) => {
        const nextIdx = Math.floor(Math.random() * CODE_LINES.length);
        const newLines = [...prev, CODE_LINES[nextIdx]];
        if (newLines.length > VISIBLE_LINES + 2) {
          return newLines.slice(-VISIBLE_LINES - 1);
        }
        return newLines;
      });
      scrollOffset.current += LINE_HEIGHT;
    }

    // Smooth scroll animation
    scrollOffset.current *= 0.95;
  });

  // Opacity is 0 when not looking, fades in when looking
  const opacity = opacityRef.current;

  // Hide completely when faded out (allows fade-out animation to complete)
  if (opacity < 0.02) return null;

  // Panel dimensions (roughly square)
  const panelWidth = 0.65;
  const panelHeight = LINE_HEIGHT * VISIBLE_LINES + 0.04;
  const padding = 0.025;
  const halfW = panelWidth / 2;
  const halfH = panelHeight / 2;

  return (
    <group
      ref={groupRef}
      position={[0, 0.1, 2.2]}
    >
      {lines.map((line, index) => {
        // Calculate position from bottom up, centered vertically
        const yPos = (index - lines.length + VISIBLE_LINES) * LINE_HEIGHT - scrollOffset.current - halfH + padding + LINE_HEIGHT / 2;

        // Fade out at top, fade in at bottom
        const normalizedY = (yPos + halfH) / panelHeight;
        const lineFade = Math.min(1, Math.max(0, normalizedY + 0.2)) * Math.min(1, Math.max(0, 1 - (normalizedY - 0.7) * 4));
        const lineOpacity = opacity * lineFade * 0.9;

        if (lineOpacity < 0.01) return null;

        return (
          <Text
            key={`${index}-${line}`}
            position={[-halfW + padding, yPos, 0]}
            fontSize={0.065}
            color={TEXT_COLOR}
            anchorX="left"
            anchorY="middle"
            fillOpacity={lineOpacity}
          >
            {line}
          </Text>
        );
      })}

    </group>
  );
}
