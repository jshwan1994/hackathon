"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";

interface Valve3DViewerProps {
  valveType: string; // VC, VG, VL, VB, LCV, FCV, HV
}

// 체크밸브 3D 모델
function CheckValveModel() {
  return (
    <group>
      {/* 메인 바디 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 2, 32]} />
        <meshStandardMaterial
          color="#3b82f6"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 플랜지 왼쪽 */}
      <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1, 1, 0.2, 32]} />
        <meshStandardMaterial color="#1e40af" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 플랜지 오른쪽 */}
      <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1, 1, 0.2, 32]} />
        <meshStandardMaterial color="#1e40af" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 체크 디스크 */}
      <mesh position={[0.3, 0, 0]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.1, 1.2, 1.2]} />
        <meshStandardMaterial color="#60a5fa" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 볼트 */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[
            -1.2 + Math.cos(angle) * 0.7,
            Math.sin(angle) * 0.7,
            0,
          ]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.08, 0.08, 0.15, 6]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// 게이트밸브 3D 모델
function GateValveModel() {
  return (
    <group>
      {/* 메인 바디 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.6, 1.6]} />
        <meshStandardMaterial
          color="#10b981"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 상단 보닛 */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 1, 32]} />
        <meshStandardMaterial color="#059669" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 스템 (핸들 축) */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.5, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 핸들 휠 */}
      <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.5, 0.08, 16, 32]} />
        <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 핸들 스포크 */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.25, 3, Math.sin(angle) * 0.25]}
          rotation={[0, angle, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* 플랜지 */}
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[1, 1, 0.2, 32]} />
          <meshStandardMaterial color="#064e3b" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// 글로브밸브 3D 모델
function GlobeValveModel() {
  return (
    <group>
      {/* 구형 바디 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#f59e0b"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 상단 보닛 */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.8, 32]} />
        <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 스템 */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 핸들 휠 */}
      <mesh position={[0, 2.7, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.4, 0.06, 16, 32]} />
        <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 인렛 파이프 */}
      <mesh position={[-1, -0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.8, 32]} />
        <meshStandardMaterial color="#92400e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 아웃렛 파이프 */}
      <mesh position={[1, -0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.8, 32]} />
        <meshStandardMaterial color="#92400e" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// 레벨 컨트롤 밸브 (LCV) 3D 모델 - 글로브밸브 + 공압 액추에이터
function LevelControlValveModel() {
  return (
    <group>
      {/* 글로브 바디 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial
          color="#8b5cf6"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 공압 액추에이터 실린더 */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 1.8, 32]} />
        <meshStandardMaterial color="#6d28d9" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 액추에이터 상단 캡 */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <cylinderGeometry args={[0.65, 0.6, 0.3, 32]} />
        <meshStandardMaterial color="#5b21b6" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 스템 */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 에어 공급 포트 */}
      <mesh position={[0.5, 2.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 인렛/아웃렛 파이프 */}
      <mesh position={[-1, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.8, 32]} />
        <meshStandardMaterial color="#7c3aed" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.8, 32]} />
        <meshStandardMaterial color="#7c3aed" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 플랜지 */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.15, 32]} />
          <meshStandardMaterial color="#4c1d95" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// 플로우 컨트롤 밸브 (FCV) 3D 모델 - 글로브밸브 + 다이어프램 액추에이터
function FlowControlValveModel() {
  return (
    <group>
      {/* 글로브 바디 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial
          color="#0891b2"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 다이어프램 액추에이터 (돔 형태) */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0e7490" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 액추에이터 베이스 */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.5, 0.4, 32]} />
        <meshStandardMaterial color="#155e75" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 스템 */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 에어 공급 포트 */}
      <mesh position={[0, 2.0, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 인렛/아웃렛 파이프 */}
      <mesh position={[-1, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.8, 32]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.8, 32]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 플랜지 */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.15, 32]} />
          <meshStandardMaterial color="#164e63" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// 핸드 밸브 (HV) 3D 모델 - 수동 게이트밸브
function HandValveModel() {
  return (
    <group>
      {/* 메인 바디 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.4, 1.4]} />
        <meshStandardMaterial
          color="#dc2626"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 보닛 */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.8, 32]} />
        <meshStandardMaterial color="#b91c1c" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 스템 */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.2, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 핸들 휠 - 빨간색 */}
      <mesh position={[0, 2.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.5, 0.08, 16, 32]} />
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 핸들 스포크 */}
      {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.25, 2.6, Math.sin(angle) * 0.25]}
          rotation={[0, angle, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* 플랜지 */}
      {[-1.1, 1.1].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.18, 32]} />
          <meshStandardMaterial color="#991b1b" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* 볼트 */}
      {[-1.1, 1.1].map((x) =>
        [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
          <mesh
            key={`${x}-${i}`}
            position={[
              x + (x > 0 ? 0.05 : -0.05),
              Math.cos(angle) * 0.65,
              Math.sin(angle) * 0.65,
            ]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.06, 0.06, 0.12, 6]} />
            <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
          </mesh>
        ))
      )}
    </group>
  );
}

// 볼밸브 3D 모델
function BallValveModel() {
  return (
    <group>
      {/* 메인 바디 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.8, 1.8]} />
        <meshStandardMaterial
          color="#ef4444"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 내부 볼 */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#dc2626"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* 볼 구멍 (유로) */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 1.8, 32]} />
        <meshStandardMaterial
          color="#1c1f27"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* 레버 핸들 축 */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.6, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 레버 핸들 */}
      <mesh position={[0.6, 1.5, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[1.2, 0.15, 0.3]} />
        <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 레버 그립 */}
      <mesh position={[1.1, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
        <meshStandardMaterial color="#ef4444" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* 플랜지 */}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[1.1, 1.1, 0.2, 32]} />
          <meshStandardMaterial color="#991b1b" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* 볼트 */}
      {[-1.3, 1.3].map((x) =>
        [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
          <mesh
            key={`${x}-${i}`}
            position={[
              x + (x > 0 ? 0.05 : -0.05),
              Math.cos(angle) * 0.8,
              Math.sin(angle) * 0.8,
            ]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.08, 0.08, 0.15, 6]} />
            <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
          </mesh>
        ))
      )}
    </group>
  );
}

// 3D 씬
function ValveScene({ valveType }: { valveType: string }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={50} />
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.8}
      />

      {/* 조명 */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 3, -5]} intensity={0.5} />
      <pointLight position={[0, -2, 0]} intensity={0.3} />

      {/* 환경 맵 */}
      <Environment preset="studio" />

      {/* 밸브 타입별 모델 */}
      {valveType === "VC" && <CheckValveModel />}
      {valveType === "VG" && <GateValveModel />}
      {valveType === "VL" && <GlobeValveModel />}
      {valveType === "VB" && <BallValveModel />}
      {valveType === "LCV" && <LevelControlValveModel />}
      {valveType === "FCV" && <FlowControlValveModel />}
      {valveType === "HV" && <HandValveModel />}

      {/* 바닥 그림자 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </>
  );
}

export default function Valve3DViewer({ valveType }: Valve3DViewerProps) {
  const valveInfo = {
    VC: { name: "체크밸브 (Check Valve)" },
    VG: { name: "게이트밸브 (Gate Valve)" },
    VL: { name: "글로브밸브 (Globe Valve)" },
    VB: { name: "볼밸브 (Ball Valve)" },
    LCV: { name: "레벨 컨트롤 밸브 (Level Control Valve)" },
    FCV: { name: "플로우 컨트롤 밸브 (Flow Control Valve)" },
    HV: { name: "핸드 밸브 (Hand Valve)" },
  };

  const info = valveInfo[valveType as keyof typeof valveInfo] || valveInfo.VG;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-white text-sm font-semibold">3D 모델 미리보기</h2>
        <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wide border border-green-500/30">
          LIVE
        </span>
      </div>

      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-[#0a0c10] to-[#1c1f27] rounded-xl overflow-hidden border border-white/10 group shadow-lg">
        {/* 3D Canvas */}
        <Canvas shadows>
          <Suspense fallback={null}>
            <ValveScene valveType={valveType} />
          </Suspense>
        </Canvas>

        {/* 밸브 타입 표시 */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
          <p className="text-xs text-white/80 font-medium">{info.name}</p>
        </div>

        {/* 회전 힌트 */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
          <span className="material-symbols-outlined text-white/60 !text-[16px]">
            3d_rotation
          </span>
        </div>
      </div>
    </div>
  );
}
