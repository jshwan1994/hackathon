"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ValveData } from "@/types/valve";

interface ImageViewerProps {
  imageUrl: string;
  onLoadSuccess?: () => void;
  selectedValve?: ValveData | null;
}

export default function ImageViewer({ imageUrl, onLoadSuccess, selectedValve }: ImageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLoad = () => {
    setLoading(false);
    onLoadSuccess?.();
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 25, 300));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 25, 50));
  };

  const resetZoom = () => {
    setScale(100);
  };

  // 줌 변경 시 스크롤 위치 중앙으로
  useEffect(() => {
    if (containerRef.current && scale > 100) {
      const container = containerRef.current;
      const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      const scrollTop = (container.scrollHeight - container.clientHeight) / 2;
      container.scrollTo({ left: scrollLeft, top: scrollTop, behavior: 'smooth' });
    }
  }, [scale]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0f1115]">
      {/* 로딩 표시 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f1115] z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-[#9da6b9]">도면 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 이미지 뷰어 */}
      <div
        className="flex-1 overflow-auto custom-scrollbar"
        ref={containerRef}
      >
        <div
          className="relative"
          style={{
            width: `${scale}%`,
            height: `${scale}%`,
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          <Image
            src={imageUrl}
            alt="P&ID Drawing"
            fill
            className="object-contain"
            onLoad={handleLoad}
            priority
          />
          {/* 밸브 마커 */}
          {selectedValve && selectedValve.position && (
            <div
              className="absolute z-10 pointer-events-none"
              style={{
                left: `${selectedValve.position.x_percent}%`,
                top: `${selectedValve.position.y_percent}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* 펄스 애니메이션 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-red-500/40 rounded-full animate-ping"></div>
              </div>
              {/* 마커 본체 */}
              <div className="relative w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg shadow-red-500/50"></div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-[#1c1f27]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl px-3 md:px-4 py-2 md:py-3 flex items-center gap-2 md:gap-4 z-40">
        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 50}
            className="p-1.5 md:p-2 hover:bg-white/10 active:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined !text-[18px] md:!text-[20px] text-white">
              zoom_out
            </span>
          </button>
          <span className="text-xs md:text-sm text-white font-mono min-w-[45px] md:min-w-[60px] text-center">
            {scale}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 300}
            className="p-1.5 md:p-2 hover:bg-white/10 active:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined !text-[18px] md:!text-[20px] text-white">
              zoom_in
            </span>
          </button>
          <button
            onClick={resetZoom}
            className="p-1.5 md:p-2 hover:bg-white/10 active:bg-white/20 rounded transition-colors"
            title="원본 크기"
          >
            <span className="material-symbols-outlined !text-[18px] md:!text-[20px] text-white">
              fit_screen
            </span>
          </button>
        </div>

        <div className="w-px h-5 md:h-6 bg-white/10"></div>

        {/* 전체화면 */}
        <button
          onClick={() => {
            const container = containerRef.current;
            if (container && container.requestFullscreen) {
              container.requestFullscreen();
            }
          }}
          className="p-1.5 md:p-2 hover:bg-white/10 active:bg-white/20 rounded transition-colors"
          title="전체화면"
        >
          <span className="material-symbols-outlined !text-[18px] md:!text-[20px] text-white">
            fullscreen
          </span>
        </button>
      </div>
    </div>
  );
}
