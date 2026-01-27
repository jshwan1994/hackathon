"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ValveData } from "@/types/valve";

interface ImageViewerProps {
  imageUrl: string;
  onLoadSuccess?: () => void;
  selectedValve?: ValveData | null;
  isPanelOpen?: boolean;
}

export default function ImageViewer({ imageUrl, onLoadSuccess, selectedValve, isPanelOpen = false }: ImageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
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
    setPosition({ x: 0, y: 0 });
  };

  // 팬 모드 토글
  const togglePanMode = () => {
    setIsPanning(!isPanning);
  };

  // 마우스 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isPanning) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };


  return (
    <div className={`relative w-full h-full flex flex-col bg-[#0f1115] transition-all duration-300 ${isPanelOpen ? 'md:pr-[400px]' : ''}`}>
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
        className={`flex-1 overflow-hidden ${isPanning ? 'cursor-grab' : ''} ${isDragging ? '!cursor-grabbing' : ''}`}
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          userSelect: isPanning ? 'none' : 'auto'
        }}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale / 100})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
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
                <div className="w-16 h-16 border-2 border-red-500/40 rounded animate-ping"></div>
              </div>
              {/* 마커 본체 - 모서리 괄호 스타일 */}
              <div className="relative w-14 h-14">
                {/* 좌상단 */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-red-500"></div>
                {/* 우상단 */}
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-red-500"></div>
                {/* 좌하단 */}
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-red-500"></div>
                {/* 우하단 */}
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-red-500"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className={`absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-[#1c1f27]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl px-3 md:px-4 py-2 md:py-3 flex items-center gap-2 md:gap-4 z-40 transition-all duration-300 ${isPanelOpen ? 'md:-translate-x-[calc(50%+200px)]' : ''}`}>
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

        {/* 손바닥(팬) 모드 */}
        <button
          onClick={togglePanMode}
          className={`p-1.5 md:p-2 rounded transition-colors ${isPanning ? 'bg-primary/80 hover:bg-primary' : 'hover:bg-white/10 active:bg-white/20'}`}
          title="손바닥 도구 (드래그로 이동)"
        >
          <span className="material-symbols-outlined !text-[18px] md:!text-[20px] text-white">
            pan_tool
          </span>
        </button>

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
