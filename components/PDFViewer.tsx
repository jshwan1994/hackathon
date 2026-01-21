"use client";

import { useState } from "react";

interface PDFViewerProps {
  pdfUrl: string;
  onLoadSuccess?: () => void;
}

export default function PDFViewer({ pdfUrl, onLoadSuccess }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(100);

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

      {/* PDF Iframe */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div
          className="w-full h-full flex items-center justify-center p-4"
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease'
          }}
        >
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full min-h-[800px] bg-white shadow-2xl"
            onLoad={handleLoad}
            title="P&ID Drawing"
          />
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
            const iframe = document.querySelector('iframe');
            if (iframe) {
              iframe.requestFullscreen?.();
            }
          }}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          title="전체화면"
        >
          <span className="material-symbols-outlined !text-[20px] text-white">
            fullscreen
          </span>
        </button>
      </div>
    </div>
  );
}
