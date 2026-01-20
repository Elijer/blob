import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import { Face } from "./Face";

interface BlobMascotProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
}

// Create noise function outside component to persist
const noise3D = createNoise3D();

export function BlobMascot({
  position = [0, 0, 0],
  scale = 1,
  color = "#ff9a9e",
}: BlobMascotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  // Store original vertex positions on first render
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 4);
    return geo;
  }, []);

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

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const geo = mesh.geometry as THREE.BufferGeometry;
    const positionAttr = geo.attributes.position;

    // Store original positions on first frame
    if (!originalPositions.current) {
      originalPositions.current = new Float32Array(positionAttr.array);
    }

    const time = clock.getElapsedTime();
    const positions = positionAttr.array as Float32Array;
    const original = originalPositions.current;

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

      // Create wiggly displacement using noise - gentler, slower
      const noiseFreq = 1.2;
      const noiseAmp = 0.06;
      const noiseValue = noise3D(
        nx * noiseFreq + time * 0.3,
        ny * noiseFreq + time * 0.25,
        nz * noiseFreq + time * 0.28
      );

      // Apply displacement along normal
      const displacement = 1 + noiseValue * noiseAmp;
      positions[i] = ox * displacement;
      positions[i + 1] = oy * displacement;
      positions[i + 2] = oz * displacement;
    }

    positionAttr.needsUpdate = true;
    geo.computeVertexNormals();
  });

  // Create soft, matte material - less plastic-like
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
      metalness: 0.0,
      envMapIntensity: 0.15,
    });
  }, [color]);

  return (
    <animated.group
      position={position}
      scale-x={squash.to((s) => scale / s)}
      scale-y={squash.to((s) => scale * s)}
      scale-z={squash.to((s) => scale / s)}
      position-y={bounceY}
    >
      {/* Main blob body */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />

      {/* Face overlay - only show on main blob */}
      {scale >= 1 && <Face blobColor={color} />}

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
  );
}
