"use client";

import { useState, useRef } from "react";
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
  const [devMode, setDevMode] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{x: number, y: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleLoad = () => {
    setLoading(false);
    onLoadSuccess?.();
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 10, 200));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 10, 50));
  };

  const resetZoom = () => {
    setScale(100);
  };

  // 도면 클릭 시 좌표 계산
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!devMode || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const coords = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    setClickedCoords(coords);

    // 클립보드에 복사
    const coordText = `"x_percent": ${coords.x}, "y_percent": ${coords.y}`;
    navigator.clipboard.writeText(coordText);
  };

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
      <div className="flex-1 overflow-auto custom-scrollbar" ref={containerRef}>
        <div
          className="w-full h-full flex items-center justify-center p-4"
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease'
          }}
        >
          <div
            ref={imageContainerRef}
            className="relative w-full h-full"
            onClick={handleImageClick}
            style={{ cursor: devMode ? 'crosshair' : 'default' }}
          >
            <Image
              src={imageUrl}
              alt="P&ID Drawing"
              fill
              className="object-contain"
              onLoad={handleLoad}
              priority
            />
            {/* 개발자 모드: 클릭한 위치 표시 */}
            {devMode && clickedCoords && (
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  left: `${clickedCoords.x}%`,
                  top: `${clickedCoords.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
              </div>
            )}
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
                  <div className="w-16 h-16 bg-primary/30 rounded-full animate-ping"></div>
                </div>
                {/* 마커 본체 */}
                <div className="relative w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg shadow-primary/50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white !text-[16px]">location_on</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1c1f27]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl px-4 py-3 flex items-center gap-4 z-40">
        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 50}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined !text-[20px] text-white">
              zoom_out
            </span>
          </button>
          <span className="text-sm text-white font-mono min-w-[60px] text-center">
            {scale}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 200}
            className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined !text-[20px] text-white">
              zoom_in
            </span>
          </button>
          <button
            onClick={resetZoom}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="원본 크기"
          >
            <span className="material-symbols-outlined !text-[20px] text-white">
              fit_screen
            </span>
          </button>
        </div>

        <div className="w-px h-6 bg-white/10"></div>

        {/* 전체화면 */}
        <button
          onClick={() => {
            const container = document.querySelector('.relative.w-full.h-full > div');
            if (container && container.requestFullscreen) {
              container.requestFullscreen();
            }
          }}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          title="전체화면"
        >
          <span className="material-symbols-outlined !text-[20px] text-white">
            fullscreen
          </span>
        </button>

        <div className="w-px h-6 bg-white/10"></div>

        {/* 개발자 모드 토글 */}
        <button
          onClick={() => setDevMode(!devMode)}
          className={`p-2 rounded transition-colors ${devMode ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-white'}`}
          title="좌표 찾기 모드"
        >
          <span className="material-symbols-outlined !text-[20px]">
            my_location
          </span>
        </button>
      </div>

      {/* 개발자 모드 좌표 표시 */}
      {devMode && (
        <div className="absolute top-4 left-4 bg-[#1c1f27]/95 backdrop-blur-xl border border-red-500/30 rounded-lg shadow-2xl px-4 py-3 z-50">
          <div className="text-red-400 text-xs font-bold mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px]">my_location</span>
            좌표 찾기 모드
          </div>
          {clickedCoords ? (
            <div className="text-white font-mono text-sm">
              <div>X: <span className="text-primary">{clickedCoords.x}%</span></div>
              <div>Y: <span className="text-primary">{clickedCoords.y}%</span></div>
              <div className="text-xs text-green-400 mt-2">클립보드에 복사됨!</div>
            </div>
          ) : (
            <div className="text-[#9da6b9] text-sm">도면을 클릭하세요</div>
          )}
        </div>
      )}
    </div>
  );
}
