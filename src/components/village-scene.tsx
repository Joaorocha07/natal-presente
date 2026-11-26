"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import { ACCENTS, type AccentKey } from "./village-accents";

const SNOW = "#f5eadb";
const FOREST = "#2a5244";
const FOREST_DARK = "#1f3d33";
const WALL = "#9a6a47";
const WINDOW = "#ffb067";

/** Pinheiro: três cones empilhados com pontas nevadas e bolinhas opcionais. */
function Tree({ position, scale = 1, accent, baubles = false }: {
  position: [number, number, number];
  scale?: number;
  accent: string;
  baubles?: boolean;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.3, 8]} />
        <meshStandardMaterial color="#6b4630" roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.35 + i * 0.38, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.52 - i * 0.14, 0.62, 10]} />
            <meshStandardMaterial color={FOREST} roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <coneGeometry args={[0.36 - i * 0.1, 0.34, 10]} />
            <meshStandardMaterial color={SNOW} roughness={0.95} flatShading />
          </mesh>
        </group>
      ))}
      {baubles &&
        [
          [0.3, 0.45, 0.2],
          [-0.22, 0.85, 0.2],
          [0.08, 1.2, 0.14],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color={accent} metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
    </group>
  );
}

/** Casinha: paredes de madeira, telhado nevado, janelas e porta acesas. */
function House({ position, rotation = 0, size = [1.2, 0.8, 1], accent }: {
  position: [number, number, number];
  rotation?: number;
  size?: [number, number, number];
  accent: string;
}) {
  const [w, h, d] = size;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={WALL} roughness={0.8} />
      </mesh>
      {/* telhado (pirâmide de 4 faces) com neve por cima */}
      <mesh position={[0, h + 0.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) * 0.82, 0.62, 4]} />
        <meshStandardMaterial color={accent} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, h + 0.42, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[Math.max(w, d) * 0.86, 0.5, 4]} />
        <meshStandardMaterial color={SNOW} roughness={0.95} flatShading />
      </mesh>
      {/* chaminé */}
      <mesh position={[w * 0.25, h + 0.55, -d * 0.15]}>
        <boxGeometry args={[0.16, 0.34, 0.16]} />
        <meshStandardMaterial color="#7a4a35" />
      </mesh>
      {/* janelas e porta */}
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x * w, h * 0.55, d / 2 + 0.01]}>
          <planeGeometry args={[0.2, 0.24]} />
          <meshStandardMaterial color={WINDOW} emissive={WINDOW} emissiveIntensity={1.4} />
        </mesh>
      ))}
      <mesh position={[0, h * 0.28, d / 2 + 0.01]}>
        <planeGeometry args={[0.18, 0.34]} />
        <meshStandardMaterial color="#5a3724" />
      </mesh>
    </group>
  );
}

/** Igreja/torre com agulha da cor de destaque. */
function Tower({ position, accent }: { position: [number, number, number]; accent: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.1, 1.6, 1.1]} />
        <meshStandardMaterial color="#b98a63" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.95, 1.5, 4]} />
        <meshStandardMaterial color={accent} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 1.95, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.0, 1.0, 4]} />
        <meshStandardMaterial color={SNOW} roughness={0.95} flatShading />
      </mesh>
      {[0.3, 0.9].map((y) => (
        <mesh key={y} position={[0, y, 0.56]}>
          <planeGeometry args={[0.22, 0.32]} />
          <meshStandardMaterial color={WINDOW} emissive={WINDOW} emissiveIntensity={1.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Bolas de Natal flutuando em volta do diorama. */
function Ornament({ position, color, radius = 0.22, speed = 1 }: {
  position: [number, number, number];
  color: string;
  radius?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * speed + position[0]) * 0.12;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[0, radius + 0.03, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.07, 10]} />
        <meshStandardMaterial color="#e3b264" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Flocos caindo dentro do volume do diorama. */
function Snowfall({ count = 140 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = (n: number) => (Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1;
      positions[i * 3] = (Math.abs(r(1)) - 0.5) * 10;
      positions[i * 3 + 1] = Math.abs(r(2)) * 6;
      positions[i * 3 + 2] = (Math.abs(r(3)) - 0.5) * 6;
      speeds[i] = 0.25 + Math.abs(r(4)) * 0.5;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((_, delta) => {
    const attr = ref.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!attr) return;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) - speeds[i] * delta;
      if (y < 0.2) y = 6;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.05} transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

function Diorama({ accent }: { accent: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.25) * 0.12;
  });

  return (
    <group ref={group} position={[0, -1.1, 0]}>
      {/* base: lastro de neve com "beirada" e bloco verde por baixo */}
      <RoundedBox args={[9, 0.45, 4.6]} radius={0.22} smoothness={4} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color={SNOW} roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[8.6, 0.5, 4.2]} radius={0.18} smoothness={4} position={[0, -0.42, 0]}>
        <meshStandardMaterial color={FOREST_DARK} roughness={0.9} />
      </RoundedBox>

      <Tower position={[2.7, 0.22, -0.4]} accent={accent} />
      <House position={[0.6, 0.22, -0.2]} rotation={0.1} size={[1.5, 0.95, 1.2]} accent={accent} />
      <House position={[-1.9, 0.22, 0.2]} rotation={-0.2} size={[1.35, 0.85, 1.1]} accent={accent} />
      <House position={[-0.5, 0.22, 1.3]} rotation={0.25} size={[0.9, 0.6, 0.8]} accent={accent} />

      <Tree position={[-3.5, 0.22, -0.8]} scale={1.15} accent={accent} baubles />
      <Tree position={[-3.0, 0.22, 1.1]} scale={0.8} accent={accent} />
      <Tree position={[-2.4, 0.22, -1.4]} scale={0.9} accent={accent} />
      <Tree position={[-0.9, 0.22, -1.4]} scale={1.3} accent={accent} baubles />
      <Tree position={[1.5, 0.22, 1.2]} scale={0.85} accent={accent} />
      <Tree position={[1.9, 0.22, -1.3]} scale={1.05} accent={accent} baubles />
      <Tree position={[3.9, 0.22, 0.8]} scale={0.95} accent={accent} />
      <Tree position={[0.4, 0.22, 1.6]} scale={0.6} accent={accent} />

      {/* luz quente saindo das janelas */}
      <pointLight position={[0.6, 0.9, 0.9]} color={WINDOW} intensity={3} distance={4} />
      <pointLight position={[-1.9, 0.8, 1]} color={WINDOW} intensity={2.4} distance={4} />
      <pointLight position={[2.7, 1, 0.4]} color={WINDOW} intensity={2.4} distance={4} />
    </group>
  );
}

export default function VillageScene({ accent }: { accent: AccentKey }) {
  const color = ACCENTS[accent].color;
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2.2, 9.2], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.9} color="#cfe0d6" />
      <directionalLight position={[4, 7, 5]} intensity={2} color="#fff1d6" castShadow />
      <hemisphereLight args={["#cfe3d8", "#10211b", 0.5]} />

      <Diorama accent={color} />

      <Ornament position={[-3.8, 2.3, 0]} color={color} radius={0.3} speed={1.1} />
      <Ornament position={[3.9, 2.8, 0.6]} color="#d9a55a" radius={0.22} speed={0.9} />
      <Ornament position={[-1.4, 3.1, -0.5]} color="#4f8a6d" radius={0.16} speed={1.4} />
      <Ornament position={[1.7, 3.4, 0.2]} color={color} radius={0.18} speed={1.2} />

      <Snowfall />

      {/* arrastar para girar; sem zoom/scroll para não prender a página */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={Math.PI / 5}
        target={[0, 0.2, 0]}
      />
    </Canvas>
  );
}
