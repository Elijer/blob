import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment as DreiEnvironment,
  Lightformer,
} from "@react-three/drei";
import * as THREE from "three";

export function Environment() {
  const mainLightRef = useRef<THREE.DirectionalLight>(null);

  // Subtle light animation
  useFrame(({ clock }) => {
    if (mainLightRef.current) {
      const time = clock.getElapsedTime();
      mainLightRef.current.intensity = 1.5 + Math.sin(time * 0.5) * 0.2;
    }
  });

  return (
    <>
      {/* Main ambient lighting */}
      <ambientLight intensity={0.4} />

      {/* Key light - warm tone */}
      <directionalLight
        ref={mainLightRef}
        position={[5, 5, 5]}
        intensity={1.5}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Fill light - cool tone for depth */}
      <directionalLight
        position={[-3, 2, -3]}
        intensity={0.5}
        color="#e6f0ff"
      />

      {/* Rim light for volumetric effect */}
      <spotLight
        position={[0, 5, -5]}
        intensity={1}
        angle={0.5}
        penumbra={1}
        color="#ff9eb8"
      />

      {/* Subtle point light for inner glow effect */}
      <pointLight position={[0, 0, 2]} intensity={0.3} color="#ffd6e0" />

      {/* Ground contact shadows for floating effect */}
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
        color="#1a1a2e"
      />

      {/* Environment map for reflections */}
      <DreiEnvironment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={2}
          />
          <Lightformer
            form="ring"
            color="#ff9eb8"
            intensity={1}
            position={[10, 3, 0]}
            scale={2}
          />
        </group>
      </DreiEnvironment>

      {/* Volumetric light rays effect using a subtle cone */}
      <VolumetricLight position={[3, 4, 2]} />
    </>
  );
}

// Simple volumetric light effect using a transparent cone
function VolumetricLight({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      meshRef.current.material.opacity = 0.03 + Math.sin(time * 0.8) * 0.01;
    }
  });

  return (
    <mesh ref={meshRef as any} position={position} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[2, 8, 32, 1, true]} />
      <meshBasicMaterial
        color="#fff8e7"
        transparent
        opacity={0.03}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
