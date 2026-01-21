"use client";

import { ValveData } from "@/types/valve";

interface ValveMarkerProps {
  valve: ValveData;
  position?: { x: number; y: number };
}

export default function ValveMarker({ valve, position = { x: 50, y: 50 } }: ValveMarkerProps) {
  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* 빨간색 펄스 애니메이션 */}
      <div className="relative flex items-center justify-center">
        {/* 외부 펄스 링 */}
        <div className="absolute inset-0">
          <div className="valve-marker-pulse bg-red-500/30 rounded-full w-16 h-16"></div>
        </div>
        <div className="absolute inset-0 delay-75">
          <div className="valve-marker-pulse bg-red-500/20 rounded-full w-16 h-16"></div>
        </div>

        {/* 중앙 빨간 점 */}
        <div className="relative z-10">
          <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-60"></div>
          <div className="relative bg-red-500 w-8 h-8 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.8)] border-2 border-white"></div>
        </div>
      </div>
    </div>
  );
}
