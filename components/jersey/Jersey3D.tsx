"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as THREE from "three";

export type CollarType = "bisiklet" | "polo" | "v_yaka";
export type SleeveType = "kisa" | "uzun";
export type Fabric = "mat" | "parlak" | "klasik";
export type JerseyView = "free" | "front" | "back" | "right" | "left";

export interface Jersey3DProps {
  frontCanvas: HTMLCanvasElement | null;
  backCanvas: HTMLCanvasElement | null;
  sleeveCanvas: HTMLCanvasElement | null;
  shortsCanvas: HTMLCanvasElement | null;
  secondaryColor: string;
  shortsColor: string;
  socksColor: string;
  collarType: CollarType;
  sleeveType: SleeveType;
  fabric: Fabric;
  view: JerseyView;
  /** WebGL canvas + renderer hazır olduğunda çağrılır — yüksek çözünürlüklü PNG/PDF dışa aktarma bunu kullanır */
  onCanvasReady?: (canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) => void;
}

// Forma+şort+çorap birlikte dikey ~4.45 birim (yaka y≈1.48'den çorap tabanı
// y≈-2.97'ye) + kollarla birlikte yatayda ~5 birim genişlik kaplıyor. 40°
// FOV'da bunun tamamının kadraja sığması için kamera en az ~8 birim uzakta
// olmalı — daha yakın bir mesafe yalnızca yaka/omuz bölgesini gösterir.
const VIEW_DISTANCE = 8;
const VIEW_CENTER: [number, number, number] = [0, -0.75, 0];
const VIEW_ANGLES: Record<string, [number, number, number]> = {
  front: [0, VIEW_CENTER[1], VIEW_DISTANCE],
  back: [0, VIEW_CENTER[1], -VIEW_DISTANCE],
  right: [VIEW_DISTANCE, VIEW_CENTER[1], 0],
  left: [-VIEW_DISTANCE, VIEW_CENTER[1], 0],
};

function fabricMaterialProps(fabric: Fabric) {
  if (fabric === "parlak") return { roughness: 0.25, metalness: 0.15 };
  if (fabric === "mat") return { roughness: 0.95, metalness: 0 };
  return { roughness: 0.6, metalness: 0.05 }; // klasik
}

// Gövde profili: bel-gögüs-omuz arasında yumuşak bir daralma/genişleme —
// düz bir silindir yerine gerçek bir forma silueti hissi verir.
const TORSO_PROFILE = [
  new THREE.Vector2(1.05, -1.3),
  new THREE.Vector2(1.15, -0.9),
  new THREE.Vector2(1.32, -0.25),
  new THREE.Vector2(1.28, 0.35),
  new THREE.Vector2(1.05, 0.85),
  new THREE.Vector2(0.85, 1.2),
];

function useCanvasTexture(canvas: HTMLCanvasElement | null) {
  const tex = useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.needsUpdate = true;
    return t;
  }, [canvas]);
  return tex;
}

// Gerçek bir 3D forma modeli (satın alınmış GLB/GLTF asset) yok — bunun yerine
// birkaç geometriden (belden daralan lathe gövde + kollar + yaka + şort +
// çorap) oluşan prosedürel bir forma "mesh"i kuruluyor. Foto-gerçekçi couture
// kalitesinde değil ama gerçekten 3D: fareyle/dokunuşla 360° döndürülebilir,
// PBR malzeme + HDRI ortam ışığıyla aydınlatılıyor, tasarım katmanları
// (JerseyDesignCanvas) doku olarak basılıyor.
function JerseyMesh({
  frontCanvas, backCanvas, sleeveCanvas, shortsCanvas, secondaryColor, shortsColor, socksColor, collarType, sleeveType, fabric,
}: Omit<Jersey3DProps, "view" | "onCanvasReady">) {
  const frontTexture = useCanvasTexture(frontCanvas);
  const backTexture = useCanvasTexture(backCanvas);
  const sleeveTexture = useCanvasTexture(sleeveCanvas);
  const shortsTexture = useCanvasTexture(shortsCanvas);

  useFrame(() => {
    if (frontTexture) frontTexture.needsUpdate = true;
    if (backTexture) backTexture.needsUpdate = true;
    if (sleeveTexture) sleeveTexture.needsUpdate = true;
    if (shortsTexture) shortsTexture.needsUpdate = true;
  });

  const matProps = fabricMaterialProps(fabric);
  const sleeveLength = sleeveType === "uzun" ? 1.55 : 0.75;

  return (
    <group>
      {/* Gövde: ön ve arka yarım kalıp, aynı lathe profiliyle, ayrı dokularla */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[TORSO_PROFILE, 24, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshStandardMaterial map={frontTexture ?? undefined} color={frontTexture ? "#ffffff" : "#cccccc"} {...matProps} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <latheGeometry args={[TORSO_PROFILE, 24, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshStandardMaterial map={backTexture ?? undefined} color={backTexture ? "#ffffff" : "#cccccc"} {...matProps} side={THREE.DoubleSide} />
      </mesh>

      {/* Kollar */}
      <mesh position={[-1.5, 0.6, 0]} rotation={[0, 0, Math.PI / 2.4]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, sleeveLength, 20]} />
        <meshStandardMaterial map={sleeveTexture ?? undefined} color={sleeveTexture ? "#ffffff" : secondaryColor} {...matProps} />
      </mesh>
      <mesh position={[1.5, 0.6, 0]} rotation={[0, 0, -Math.PI / 2.4]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, sleeveLength, 20]} />
        <meshStandardMaterial map={sleeveTexture ?? undefined} color={sleeveTexture ? "#ffffff" : secondaryColor} {...matProps} />
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

      {/* Şort */}
      <mesh position={[0, -1.85, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 0.92, 0.65, 28, 1, true, Math.PI * 0.1, Math.PI * 1.8]} />
        <meshStandardMaterial map={shortsTexture ?? undefined} color={shortsTexture ? "#ffffff" : shortsColor} {...matProps} side={THREE.DoubleSide} />
      </mesh>

      {/* Çorap */}
      <mesh position={[-0.42, -2.55, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.24, 0.85, 16]} />
        <meshStandardMaterial color={socksColor} {...matProps} />
      </mesh>
      <mesh position={[0.42, -2.55, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.24, 0.85, 16]} />
        <meshStandardMaterial color={socksColor} {...matProps} />
      </mesh>
    </group>
  );
}

// drei'nin hazır preset'leri (ör. "studio") harici bir CDN'den HDR dosyası
// çeker — ağ erişimi yavaş/engelliyse (kurumsal güvenlik duvarı, çevrimdışı
// kullanım vb.) sahne süresiz "yükleniyor" durumunda asılı kalır. Bunun yerine
// tamamen yerel/prosedürel bir ortam (three.js'in RoomEnvironment'ı, PMREM ile
// pişirilir) kullanılıyor — hiçbir ağ isteği yok, gerçek image-based lighting
// sağlıyor, asla takılmıyor.
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    return () => {
      envTexture.dispose();
      pmrem.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);
  return null;
}

function CameraRig({ view }: { view: JerseyView }) {
  useFrame((state) => {
    if (view === "free") return;
    const target = new THREE.Vector3(...VIEW_ANGLES[view]);
    state.camera.position.lerp(target, 0.08);
    state.camera.lookAt(...VIEW_CENTER);
  });
  return null;
}

export function Jersey3D({ onCanvasReady, ...props }: Jersey3DProps) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: [0, VIEW_CENTER[1], VIEW_DISTANCE], fov: 40 }}
      className="h-full w-full"
      onCreated={({ gl }) => {
        rendererRef.current = gl;
        onCanvasReady?.(gl.domElement, gl);
      }}
    >
      {/* 3 nokta ışık: key (parlak, ön-üst-sağ) + fill (yumuşak, karşı) + rim (arkadan siluet) */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3.5, 1.5, 2]} intensity={0.4} />
      <directionalLight position={[0, 2, -4]} intensity={0.5} color="#fff8e0" />
      <StudioEnvironment />
      <JerseyMesh {...props} />
      <CameraRig view={props.view} />
      <OrbitControls
        enablePan={false}
        enableZoom
        enabled={props.view === "free"}
        autoRotate={props.view === "free"}
        autoRotateSpeed={1.1}
        minDistance={4}
        maxDistance={14}
        target={VIEW_CENTER}
      />
    </Canvas>
  );
}
