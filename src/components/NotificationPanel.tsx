import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface NotificationPanelProps {
  visible: boolean;
  showBackground?: boolean;
}

const CODE_LINES = [
  // Oocyte & retrieval
  "26 viable oocytes discovered",
  "oocyte maturation: complete",
  "retrieval scheduled: 36hr post-trigger",
  "follicle aspiration in progress",
  "oocyte count: 18 retrieved",
  "mature oocytes: 14 (MII)",
  "oocyte quality: grade A",
  "cryopreservation initiated",
  "vitrification complete",
  "oocytes stored: tank 7, canister 3",

  // Hormone levels
  "estradiol: 2,847 pg/mL",
  "progesterone: 0.8 ng/mL",
  "LH surge detected",
  "FSH level: 6.2 mIU/mL",
  "AMH: 3.4 ng/mL",
  "beta-hCG: 245 mIU/mL",
  "progesterone levels: nominal",
  "hormone panel: within range",
  "estradiol rising normally",
  "LH: 42.1 mIU/mL (peak)",

  // Monitoring & ultrasound
  "ultrasound data received",
  "follicle count: 14",
  "lead follicle: 19mm",
  "endometrial thickness: 9.2mm",
  "trilaminar pattern confirmed",
  "antral follicle count: 22",
  "ovarian response: optimal",
  "follicle mapping complete",
  "bilateral ovary scan done",
  "uterine lining: receptive",

  // Cycle tracking
  "cycle day: 12",
  "stimulation day: 8",
  "trigger shot: tonight 10pm",
  "baseline scan scheduled",
  "monitoring visit #4 complete",
  "next appointment: 48hr",
  "cycle day 3 labs ordered",
  "mid-cycle check confirmed",
  "ovulation predicted: 24-36hr",
  "luteal phase support started",

  // Lab & embryology
  "scanning for viability...",
  "fertilization rate: 78%",
  "ICSI procedure complete",
  "embryo development: day 3",
  "8-cell embryo observed",
  "blastocyst formation: day 5",
  "embryo grading: 4AA",
  "PGT-A biopsy complete",
  "genetic results pending",
  "euploid embryos: 3",
  "embryo transfer scheduled",
  "assisted hatching performed",

  // Communications
  "contacting remote lab",
  "syncing with fertility center",
  "transferring records...",
  "patient notified",
  "physician review requested",
  "lab results transmitted",
  "secure message sent",
  "appointment confirmed",
  "consent forms received",
  "insurance verification sent",

  // IUI specific
  "IUI procedure scheduled",
  "sperm wash complete",
  "motile sperm count: 22M",
  "insemination successful",
  "post-IUI rest: 15 min",
  "IUI timing: optimal",
  "sperm preparation ready",
  "catheter placement confirmed",

  // Egg freezing
  "egg freezing cycle: day 6",
  "cryobank storage confirmed",
  "fertility preservation complete",
  "frozen oocyte inventory: 18",
  "storage renewal: 11 months",
  "thaw survival rate: 92%",
  "elective freeze: approved",

  // Medications
  "triggering protocol initiated",
  "Gonal-F: 225 IU daily",
  "Menopur: 150 IU added",
  "Cetrotide started: day 6",
  "Lupron trigger: 80 units",
  "progesterone: 50mg IM",
  "estrace: 2mg twice daily",
  "medication inventory: OK",
  "refill request: processed",
  "injection site: rotated",

  // Status updates
  "protocol: antagonist",
  "response: high responder",
  "OHSS risk: monitoring",
  "coast day: 1 of 2",
  "stim adjustment: +75 IU",
  "cycle cancelled: poor response",
  "cycle converted: IUI",
  "freeze-all recommended",
  "fresh transfer: approved",

  // System operations
  "syncing patient records...",
  "EMR update complete",
  "lab interface: connected",
  "imaging server: online",
  "backup verification: passed",
  "HIPAA audit: compliant",
  "data encryption: active",
  "portal access: granted",

  // Scheduling
  "OR suite: reserved",
  "anesthesia: confirmed",
  "pre-op labs: complete",
  "NPO after midnight",
  "arrival time: 6:30am",
  "procedure duration: 20min",
  "recovery room: available",
  "discharge time: estimated 2hr",

  // Results & outcomes
  "positive pregnancy test",
  "beta doubling: normal",
  "heartbeat detected: 6w2d",
  "twins confirmed",
  "singleton pregnancy",
  "chemical pregnancy noted",
  "beta trending down",
  "repeat beta: 48hr",

  // Coordination
  "referring clinic notified",
  "records request: sent",
  "prior auth: approved",
  "coverage verified: 80%",
  "out-of-network: processed",
  "coordination complete",
  "case review: Thursday",
  "multidisciplinary consult",

  // Quality metrics
  "lab QC: passed",
  "incubator temp: 37.0°C",
  "CO2 level: 6.0%",
  "humidity: 95%",
  "air quality: HEPA filtered",
  "equipment calibration: due",
  "maintenance log: updated",
];

const LINE_HEIGHT = 0.07;
const VISIBLE_LINES = 7;
const TEXT_COLOR_WHITE = "#FFFFFF";
const TEXT_COLOR_NO_BG = "#7CB7DA";
const MONO_FONT = "./fonts/RobotoMono-Regular.ttf";

export function NotificationPanel({ visible, showBackground = true }: NotificationPanelProps) {
  const textColor = showBackground ? TEXT_COLOR_WHITE : TEXT_COLOR_NO_BG;
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
            color={textColor}
            anchorX="left"
            anchorY="middle"
            fillOpacity={lineOpacity}
            font={MONO_FONT}
          >
            {line}
          </Text>
        );
      })}

    </group>
  );
}
