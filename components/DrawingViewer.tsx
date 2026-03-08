"use client";

import { Suspense, lazy } from "react";
import Image from "next/image";
import { ValveData } from "@/types/valve";

// 이미지 뷰어를 동적으로 로드 (클라이언트 사이드 전용)
const ImageViewer = lazy(() => import("./ImageViewer"));

interface DrawingViewerProps {
  selectedValve: ValveData | null;
  isPanelOpen?: boolean;
}

export default function DrawingViewer({ selectedValve, isPanelOpen = false }: DrawingViewerProps) {
  // 선택된 밸브가 있으면 해당 밸브의 도면 표시
  const shouldShowDrawing = selectedValve !== null;
  const drawingUrl = selectedValve ? `/drawings/${selectedValve.drawing}` : "";

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
            <ImageViewer imageUrl={drawingUrl} selectedValve={selectedValve} isPanelOpen={isPanelOpen} />
          </Suspense>

          {/* 밸브 마커 제거 - 도면만 표시 */}
        </div>
      ) : (
        // 기본 배경 (밸브 선택 전) - 3D 이미지 표시
        <div className="schematic-bg relative w-full h-full">
          {/* 3D 밸브 이미지 - 가운데 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative w-[900px] h-[900px] animate-float">
              <Image
                src="/valve-3d.png"
                alt="3D Valve"
                fill
                className="object-contain"
                priority
              />
            </div>
            {/* 안내 메시지 */}
            <div className="text-center -mt-40">
              <h2 className="text-2xl font-bold text-white mb-2">GLANCE</h2>
              <p className="text-[#9da6b9] text-lg">P&ID 도면에서 밸브 위치를 빠르게 찾아보세요</p>
            </div>
          </div>

          {/* 3D 발전소 이미지 - 오른쪽 가운데 */}
          <div className="absolute top-[25%] right-8 -translate-y-1/2 w-[550px] h-[550px] animate-float">
            <Image
              src="/power-plant-3d.png"
              alt="3D Power Plant"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
