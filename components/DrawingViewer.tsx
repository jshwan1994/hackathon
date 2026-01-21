"use client";

import { Suspense, lazy } from "react";
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
        // 기본 배경 (밸브 선택 전)
        <div className="schematic-bg cursor-grab active:cursor-grabbing flex items-center justify-center w-full h-full">
          <div className="relative w-full h-full opacity-40 transition-opacity duration-500 hover:opacity-100">
            <svg
              className="w-full h-full absolute inset-0 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="grid"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 100 0 L 0 0 0 100"
                    fill="none"
                    stroke="#282e39"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* 배관 라인 예시 */}
              <path
                d="M 100 300 L 400 300 L 400 600 L 800 600"
                fill="none"
                stroke="#3b4354"
                strokeWidth="4"
              />
              <path
                d="M 200 100 L 200 500"
                fill="none"
                stroke="#3b4354"
                strokeWidth="4"
              />
              <path
                d="M 600 200 L 900 200"
                fill="none"
                stroke="#3b4354"
                strokeWidth="4"
              />

              {/* 밸브 아이콘 예시 */}
              <g>
                <circle
                  cx="400"
                  cy="450"
                  r="15"
                  fill="#1c1f27"
                  stroke="#525b6c"
                  strokeWidth="2"
                />
                <path
                  d="M 390 440 L 410 460 M 390 460 L 410 440"
                  stroke="#525b6c"
                  strokeWidth="2"
                />
              </g>
              <g>
                <circle
                  cx="700"
                  cy="600"
                  r="15"
                  fill="#1c1f27"
                  stroke="#525b6c"
                  strokeWidth="2"
                />
                <path
                  d="M 690 590 L 710 610 M 690 610 L 710 590"
                  stroke="#525b6c"
                  strokeWidth="2"
                />
              </g>
            </svg>

            {/* 안내 메시지 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="material-symbols-outlined text-white/20 !text-[80px] mb-4 block">
                  search
                </span>
                <p className="text-white/40 text-lg">상단 검색창에서 밸브를 검색하세요</p>
                <p className="text-white/30 text-sm mt-2">예: V-102, HV-6003, VF-5027</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
