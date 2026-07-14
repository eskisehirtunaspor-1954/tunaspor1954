"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

export type CollarType = "bisiklet" | "polo" | "v_yaka";
export type SleeveType = "kisa" | "uzun";
export type Fabric = "mat" | "parlak" | "klasik";

export interface Jersey3DProps {
  frontCanvas: HTMLCanvasElement | null;
  backCanvas: HTMLCanvasElement | null;
  secondaryColor: string;
  collarType: CollarType;
  sleeveType: SleeveType;
  fabric: Fabric;
  /** "on" -> serbest döndürme; "front"/"back"/"side" -> kamerayı sabit açıya götürür */
  view: "free" | "front" | "back" | "side";
  /** WebGL canvas DOM elemanı hazır olduğunda çağrılır — PNG/PDF dışa aktarma bunu kullanır */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const VIEW_ANGLES: Record<string, [number, number, number]> = {
  front: [0, 0, 4.2],
  back: [0, 0, -4.2],
  side: [4.2, 0, 0],
};

function fabricMaterialProps(fabric: Fabric) {
  if (fabric === "parlak") return { roughness: 0.25, metalness: 0.15 };
  if (fabric === "mat") return { roughness: 0.95, metalness: 0 };
  return { roughness: 0.6, metalness: 0.05 }; // klasik
}

// Gerçek bir 3D forma modeli (satın alınmış GLB/GLTF asset) yok — bunun yerine
// birkaç basit geometriden (silindir gövde + kollar + yaka) oluşan prosedürel
// bir forma "mesh"i kuruluyor. Foto-gerçekçi couture kalitesinde değil ama
// gerçekten 3D: fareyle/dokunuşla 360° döndürülebilir, ışık/gölgesi var,
// tasarım katmanı (JerseyDesignCanvas) doku olarak ön/arka panellere basılıyor.
function JerseyMesh({ frontCanvas, backCanvas, secondaryColor, collarType, sleeveType, fabric }: Omit<Jersey3DProps, "view">) {
  const groupRef = useRef<THREE.Group>(null);

  const frontTexture = useMemo(() => {
    if (!frontCanvas) return null;
    const tex = new THREE.CanvasTexture(frontCanvas);
    tex.needsUpdate = true;
    return tex;
  }, [frontCanvas]);

  const backTexture = useMemo(() => {
    if (!backCanvas) return null;
    const tex = new THREE.CanvasTexture(backCanvas);
    tex.needsUpdate = true;
    return tex;
  }, [backCanvas]);

  useFrame(() => {
    if (frontTexture) frontTexture.needsUpdate = true;
    if (backTexture) backTexture.needsUpdate = true;
  });

  const matProps = fabricMaterialProps(fabric);
  const sleeveLength = sleeveType === "uzun" ? 1.5 : 0.75;

  return (
    <group ref={groupRef}>
      {/* Gövde: hafif oval bir silindir — ön yarısı tasarım dokusu, arka yarısı sırt dokusu */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.35, 2.6, 32, 1, true, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshStandardMaterial map={frontTexture ?? undefined} color={frontTexture ? "#ffffff" : "#cccccc"} {...matProps} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.35, 2.6, 32, 1, true, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshStandardMaterial map={backTexture ?? undefined} color={backTexture ? "#ffffff" : "#cccccc"} {...matProps} side={THREE.DoubleSide} />
      </mesh>

      {/* Kollar */}
      <mesh position={[-1.5, 0.6, 0]} rotation={[0, 0, Math.PI / 2.4]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, sleeveLength, 20]} />
        <meshStandardMaterial color={secondaryColor} {...matProps} />
      </mesh>
      <mesh position={[1.5, 0.6, 0]} rotation={[0, 0, -Math.PI / 2.4]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, sleeveLength, 20]} />
        <meshStandardMaterial color={secondaryColor} {...matProps} />
      </mesh>

      {/* Yaka */}
      {collarType === "polo" ? (
        <mesh position={[0, 1.35, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.9, 0.3, 0.08]} />
          <meshStandardMaterial color={secondaryColor} {...matProps} />
        </mesh>
      ) : (
        <mesh position={[0, 1.35, 0]}>
          <torusGeometry args={[0.55, collarType === "v_yaka" ? 0.09 : 0.13, 12, 24, Math.PI * 1.3]} />
          <meshStandardMaterial color={secondaryColor} {...matProps} />
        </mesh>
      )}
    </group>
  );
}

function CameraRig({ view }: { view: Jersey3DProps["view"] }) {
  useFrame((state) => {
    if (view === "free") return;
    const target = new THREE.Vector3(...VIEW_ANGLES[view]);
    state.camera.position.lerp(target, 0.08);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function Jersey3D({ onCanvasReady, ...props }: Jersey3DProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 4.2], fov: 40 }}
      className="h-full w-full"
      onCreated={({ gl }) => onCanvasReady?.(gl.domElement)}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 2, -4]} intensity={0.35} />
      <Environment preset="city" />
      <JerseyMesh {...props} />
      <CameraRig view={props.view} />
      <OrbitControls enablePan={false} enabled={props.view === "free"} minDistance={2.5} maxDistance={7} />
    </Canvas>
  );
}
