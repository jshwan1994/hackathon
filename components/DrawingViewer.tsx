"use client";

import { Suspense, lazy } from "react";
import Image from "next/image";
import { ValveData } from "@/types/valve";

// 이미지 뷰어를 동적으로 로드 (클라이언트 사이드 전용)
const ImageViewer = lazy(() => import("./ImageViewer"));

interface DrawingViewerProps {
  selectedValve: ValveData | null;
}

export default function DrawingViewer({ selectedValve }: DrawingViewerProps) {
  // 선택된 밸브가 있으면 도면 표시
  const shouldShowDrawing = selectedValve !== null;
  const drawingUrl = "/drawings/DH-Live-Condensate-System.png";

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {shouldShowDrawing ? (
        // 도면 표시
        <div className="w-full h-full">
          <Suspense
            fallback={
              <div className="w-full h-full schematic-bg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-[#9da6b9]">도면 뷰어 로딩 중...</p>
                </div>
              </div>
            }
          >
            <ImageViewer imageUrl={drawingUrl} selectedValve={selectedValve} />
          </Suspense>

          {/* 밸브 마커 제거 - 도면만 표시 */}
        </div>
      ) : (
        // 기본 배경 (밸브 선택 전) - 3D 밸브 이미지 표시
        <div className="schematic-bg flex items-center justify-center w-full h-full">
          <div className="flex flex-col items-center justify-center mt-32">
            {/* 3D 밸브 이미지 - 부드러운 floating 애니메이션 */}
            <div className="relative w-[900px] h-[900px] mb-6 animate-float">
              <Image
                src="/valve-3d.png"
                alt="3D Valve"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* 안내 메시지 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">PID 밸브 검색기</h2>
              <p className="text-[#9da6b9] text-lg">P&ID 도면에서 밸브 위치를 빠르게 찾아보세요</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
