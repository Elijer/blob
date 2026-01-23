import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import { Face } from "./Face";
import { NotificationPanel } from "./NotificationPanel";

interface BlobMascotProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  isSmooth?: boolean;
}

// Create noise function outside component to persist
const noise3D = createNoise3D();

// ~18 degrees in radians for horizontal turn
const HEAD_TURN_ANGLE = 0.32;
// ~25 degrees max for vertical tilt
const MAX_VERTICAL_TILT = 0.44;

export function BlobMascot({
  position = [0, 0, 0],
  scale = 1,
  color = "#7CB7DB",
  isSmooth = false,
}: BlobMascotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const clickIntensity = useRef(0);
  const targetRotationY = useRef(0);
  const targetRotationX = useRef(0);
  const [lookDirection, setLookDirection] = useState<"none" | "left" | "right">("none");

  // Store original vertex positions on first render
  // Use much higher detail for smooth mode to truly hide polygons
  const geometry = useMemo(() => {
    const detail = isSmooth ? 38 : 4;
    const geo = new THREE.IcosahedronGeometry(1, detail);
    // Reset original positions when geometry changes
    originalPositions.current = null;
    return geo;
  }, [isSmooth]);

  // Bouncy idle animation using spring - gentler, more flowy
  const { bounceY } = useSpring({
    from: { bounceY: 0 },
    to: async (next) => {
      while (true) {
        await next({ bounceY: 0.06, config: { tension: 80, friction: 14 } });
        await next({ bounceY: -0.04, config: { tension: 100, friction: 16 } });
      }
    },
    loop: true,
  });

  // Squash and stretch animation - subtler
  const { squash } = useSpring({
    from: { squash: 1 },
    to: async (next) => {
      while (true) {
        await next({ squash: 0.97, config: { tension: 60, friction: 18 } });
        await next({ squash: 1.03, config: { tension: 80, friction: 20 } });
        await next({ squash: 1, config: { tension: 70, friction: 22 } });
      }
    },
    loop: true,
  });

  // Click squish reaction spring
  const [clickSpring, clickApi] = useSpring(() => ({
    squish: 1,
    config: { tension: 300, friction: 10 },
  }));

  // Head turn animation: 8 seconds normal, then ~4 seconds looking to one side
  useEffect(() => {
    let isLeft = true;

    const doTurn = () => {
      const direction = isLeft ? "left" : "right";
      const angle = isLeft ? HEAD_TURN_ANGLE : -HEAD_TURN_ANGLE;
      isLeft = !isLeft;

      // Random vertical tilt (up or down, up to 25 degrees)
      const verticalTilt = (Math.random() * 2 - 1) * MAX_VERTICAL_TILT;

      // Show looking eyes and start turning
      setLookDirection(direction);
      targetRotationY.current = angle;
      targetRotationX.current = verticalTilt;

      // After 4 seconds, return
      setTimeout(() => {
        setLookDirection("none");
        targetRotationY.current = 0;
        targetRotationX.current = 0;
      }, 4000);
    };

    // First turn after 3 seconds (for testing), then every 8 seconds
    const firstTimeout = setTimeout(doTurn, 3000);
    const interval = setInterval(doTurn, 8000);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, []);

  const handleClick = () => {
    // Trigger the squish animation
    clickIntensity.current = 1.0;

    clickApi.start({
      from: { squish: 0.75 },
      to: { squish: 1 },
      config: { tension: 400, friction: 8 },
    });
  };

  useFrame(({ clock }) => {
    // Animate head rotation toward target (both horizontal and vertical)
    if (groupRef.current) {
      const currentY = groupRef.current.rotation.y;
      const targetY = targetRotationY.current;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(currentY, targetY, 0.08);

      const currentX = groupRef.current.rotation.x;
      const targetX = targetRotationX.current;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(currentX, targetX, 0.08);
    }

    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const geo = mesh.geometry as THREE.BufferGeometry;
    const positionAttr = geo.attributes.position;

    // Store original positions on first frame
    if (!originalPositions.current) {
      originalPositions.current = new Float32Array(positionAttr.array);
    }

    // Decay click intensity over time
    clickIntensity.current *= 0.92;

    const time = clock.getElapsedTime();
    const positions = positionAttr.array as Float32Array;
    const original = originalPositions.current;

    // Base noise parameters - keep it smooth
    const baseNoiseFreq = 1.2;
    const baseNoiseAmp = 0.06;
    const baseTimeSpeed = 0.3;

    // Click reaction - gentler, smoother wobble (lower freq = smoother)
    const clickBoost = clickIntensity.current;
    const noiseFreq = baseNoiseFreq - clickBoost * 0.4;
    const noiseAmp = baseNoiseAmp + clickBoost * 0.08;
    const timeSpeed = baseTimeSpeed + clickBoost * 0.5;

    // Apply wiggly deformation using simplex noise
    for (let i = 0; i < positions.length; i += 3) {
      const ox = original[i];
      const oy = original[i + 1];
      const oz = original[i + 2];

      // Normalize to get direction
      const length = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / length;
      const ny = oy / length;
      const nz = oz / length;

      // Create wiggly displacement using noise
      const noiseValue = noise3D(
        nx * noiseFreq + time * timeSpeed,
        ny * noiseFreq + time * timeSpeed * 0.85,
        nz * noiseFreq + time * timeSpeed * 0.9
      );

      // Add a smooth ripple wave on click
      const ripple = clickBoost * Math.sin(ny * 3 + time * 4) * 0.06;

      // Apply displacement along normal
      const displacement = 1 + noiseValue * noiseAmp + ripple;
      positions[i] = ox * displacement;
      positions[i + 1] = oy * displacement;
      positions[i + 2] = oz * displacement;
    }

    positionAttr.needsUpdate = true;
    geo.computeVertexNormals();
  });

  // Create soft, matte material
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
      metalness: 0.0,
      envMapIntensity: 0.15,
      flatShading: !isSmooth, // Flat shading shows polygons, smooth shading hides them
    });
    return mat;
  }, [color, isSmooth]);
  
  // Update material when smoothness changes
  useEffect(() => {
    if (meshRef.current && meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.flatShading = !isSmooth;
      mat.needsUpdate = true;
    }
  }, [isSmooth]);

  return (
    <group ref={groupRef} position={position}>
    <animated.group
      scale-x={squash.to((s) => scale / s)}
      scale-y={squash.to((s) => scale * s)}
      scale-z={squash.to((s) => scale / s)}
      position-y={bounceY}
    >
      {/* Click reaction scale wrapper */}
      <animated.group
        scale-x={clickSpring.squish.to((s) => 1 / s)}
        scale-y={clickSpring.squish}
        scale-z={clickSpring.squish.to((s) => 1 / s)}
      >
        {/* Main blob body */}
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
          onClick={handleClick}
          onPointerDown={handleClick}
        />

        {/* Subtle inner glow */}
        <mesh scale={0.85}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      </animated.group>

      {/* Face - rotates with the blob */}
      {scale >= 1 && <Face lookDirection={lookDirection} />}
    </animated.group>

    {/* Notification panel - outside squash/bounce, but rotates with head */}
    <NotificationPanel
      visible={lookDirection !== "none"}
    />
    </group>
  );
}
