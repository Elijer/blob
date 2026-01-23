import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SparkleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  opacity: number;
  life: number;
  maxLife: number;
  scale: number;
}

interface SparklesProps {
  count?: number;
  radius?: number;
  color?: string;
}

export function Sparkles({
  count = 12,
  radius = 1.4,
  color = "#ffffff",
}: SparklesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const sparklesRef = useRef<SparkleData[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize sparkle data
  useMemo(() => {
    sparklesRef.current = [];
    for (let i = 0; i < count; i++) {
      sparklesRef.current.push(createSparkle(radius, i * (3 / count))); // Stagger initial spawns
    }
  }, [count, radius]);

  // Create geometry for sparkle (small diamond/star shape)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // Simple quad for a sparkle
    const vertices = new Float32Array([
      0, 0.04, 0,
      0.02, 0, 0,
      0, -0.04, 0,
      -0.02, 0, 0,
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    return geo;
  }, []);

  // Material with additive blending for glow effect
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color]);

  // Reusable quaternion for Z-axis spin
  const spinQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const zAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  useFrame(({ camera }, delta) => {
    if (!meshRef.current) return;

    const sparkles = sparklesRef.current;

    for (let i = 0; i < sparkles.length; i++) {
      const sparkle = sparkles[i];

      // Update life
      sparkle.life += delta;

      // Reset sparkle if it's done
      if (sparkle.life >= sparkle.maxLife) {
        sparkles[i] = createSparkle(radius);
        continue;
      }

      // Calculate opacity: fade in for first 20%, fade out for last 30%
      const lifeRatio = sparkle.life / sparkle.maxLife;
      let opacity = 1;
      if (lifeRatio < 0.2) {
        opacity = lifeRatio / 0.2; // Fade in
      } else if (lifeRatio > 0.7) {
        opacity = 1 - (lifeRatio - 0.7) / 0.3; // Fade out
      }
      sparkle.opacity = opacity;

      // Drift movement - gentle floating motion
      sparkle.position.add(sparkle.velocity.clone().multiplyScalar(delta));

      // Add gentle wobble
      sparkle.position.x += Math.sin(sparkle.life * 2 + i) * delta * 0.05;
      sparkle.position.y += Math.cos(sparkle.life * 1.5 + i) * delta * 0.03;

      // Update instance matrix
      dummy.position.copy(sparkle.position);
      // Use scale for opacity - scale to 0 when invisible, full scale when visible
      dummy.scale.setScalar(sparkle.scale * sparkle.opacity);

      // Billboard: copy camera quaternion then add local Z spin
      dummy.quaternion.copy(camera.quaternion);
      spinQuaternion.setFromAxisAngle(zAxis, sparkle.life * 2);
      dummy.quaternion.multiply(spinQuaternion);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

function createSparkle(radius: number, initialLife = 0): SparkleData {
  // Random position on a sphere around the blob
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = radius + (Math.random() - 0.5) * 0.4;

  const position = new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );

  // Gentle outward drift with some randomness
  const velocity = position
    .clone()
    .normalize()
    .multiplyScalar(0.08 + Math.random() * 0.06);
  velocity.y += 0.05; // Slight upward bias

  return {
    position,
    velocity,
    opacity: 0,
    life: initialLife,
    maxLife: 2 + Math.random() * 1.5, // 2-3.5 seconds lifetime
    scale: 0.6 + Math.random() * 0.8,
  };
}
