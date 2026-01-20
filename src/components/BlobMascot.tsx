import { useRef, useMemo, useState, useEffect } from "react";
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

// ~18 degrees in radians
const HEAD_TURN_ANGLE = 0.32;

export function BlobMascot({
  position = [0, 0, 0],
  scale = 1,
  color = "#ff9a9e",
}: BlobMascotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const clickIntensity = useRef(0);
  const [isLooking, setIsLooking] = useState(false);

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

  // Click squish reaction spring
  const [clickSpring, clickApi] = useSpring(() => ({
    squish: 1,
    config: { tension: 300, friction: 10 },
  }));

  // Head turn rotation spring (Y-axis rotation)
  const [headSpring, headApi] = useSpring(() => ({
    rotationY: 0,
    config: { tension: 40, friction: 14 }, // Smooth and slow
  }));

  // Head turn animation every ~8 seconds
  // Sequence: center -> right -> left -> center (4 seconds total)
  useEffect(() => {
    const doHeadTurn = () => {
      setIsLooking(true);

      // Turn right first
      headApi.start({
        to: { rotationY: -HEAD_TURN_ANGLE },
        config: { tension: 40, friction: 14 },
        onRest: () => {
          // Then turn left
          setTimeout(() => {
            headApi.start({
              to: { rotationY: HEAD_TURN_ANGLE },
              config: { tension: 40, friction: 14 },
              onRest: () => {
                // Return to center
                setTimeout(() => {
                  headApi.start({
                    to: { rotationY: 0 },
                    config: { tension: 40, friction: 14 },
                    onRest: () => {
                      setIsLooking(false);
                    },
                  });
                }, 800);
              },
            });
          }, 800);
        },
      });
    };

    // Initial delay before first head turn
    const initialTimeout = setTimeout(doHeadTurn, 5000);

    // Then repeat every ~8 seconds
    const interval = setInterval(doHeadTurn, 8000 + Math.random() * 2000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [headApi]);

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
      rotation-y={headSpring.rotationY}
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
      {scale >= 1 && <Face blobColor={color} isLooking={isLooking} />}
    </animated.group>
  );
}
