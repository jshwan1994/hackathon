"use client";

import { useState, useEffect } from "react";
import { ValveData } from "@/types/valve";
import { parseValveDataNew, searchValves } from "@/lib/valveData";
import ValveDetailPanel from "@/components/ValveDetailPanel";
import DrawingViewer from "@/components/DrawingViewer";

export default function Home() {
  const [valves, setValves] = useState<ValveData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ValveData[]>([]);
  const [selectedValve, setSelectedValve] = useState<ValveData | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  // 밸브 데이터 로드
  useEffect(() => {
    async function loadValveData() {
      try {
        const response = await fetch("/data/all_valves.json");
        const rawData = await response.json();
        const parsedValves = parseValveDataNew(rawData);
        setValves(parsedValves);
      } catch (error) {
        console.error("밸브 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    loadValveData();
  }, []);

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchValves(valves, searchQuery);
      setSearchResults(results);
      // 검색 중에도 선택된 밸브와 상세 패널 유지
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, valves]);

  const handleValveSelect = (valve: ValveData) => {
    setSelectedValve(valve);
    setShowDetailPanel(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleClosePanel = () => {
    setShowDetailPanel(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedValve(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      handleValveSelect(searchResults[0]);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* 배경 도면 영역 */}
      <DrawingViewer selectedValve={selectedValve} isPanelOpen={showDetailPanel} />

      {/* 검색창 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-4 md:pt-8 px-3 md:px-4 pointer-events-none">
        <div className="w-full max-w-[640px] pointer-events-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
            <label className="relative flex items-center w-full h-12 md:h-14 bg-[#1c1f27]/90 md:bg-[#1c1f27]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-[#1c1f27]/95">
              <div className="pl-4 md:pl-6 pr-2 md:pr-3 text-[#9da6b9]">
                <span className="material-symbols-outlined !text-[20px] md:!text-[24px]">search</span>
              </div>
              <input
                className="w-full bg-transparent border-none text-white placeholder-[#9da6b9] focus:ring-0 text-sm md:text-base font-normal h-full rounded-r-full outline-none"
                placeholder="밸브 태그 검색..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="mr-4 p-2 rounded-full hover:bg-white/10 text-[#9da6b9] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined !text-[20px]">close</span>
                </button>
              )}
            </label>
          </div>

          {/* 검색 결과 드롭다운 */}
          {searchQuery && searchResults.length > 0 && (
            <div className="mt-2 bg-[#1c1f27]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
              {searchResults.slice(0, 20).map((valve, index) => (
                <button
                  key={`${valve.tag}-${index}`}
                  onClick={() => handleValveSelect(valve)}
                  className="w-full px-4 md:px-6 py-3 text-left hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5 last:border-b-0 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-medium text-sm md:text-base">{valve.tag}</div>
                    <div className="text-[#9da6b9] text-xs md:text-sm">{valve.location}</div>
                  </div>
                  <span className="material-symbols-outlined text-primary !text-[20px]">chevron_right</span>
                </button>
              ))}
              {searchResults.length > 20 && (
                <div className="px-4 md:px-6 py-3 text-center text-[#9da6b9] text-xs md:text-sm">
                  {searchResults.length - 20}개 결과 더 있음
                </div>
              )}
            </div>
          )}

          {/* 검색 결과 없음 */}
          {searchQuery && searchResults.length === 0 && !loading && (
            <div className="mt-2 bg-[#1c1f27]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl px-6 py-4 text-center text-[#9da6b9]">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 밸브 상세 정보 패널 */}
      {selectedValve && showDetailPanel && (
        <ValveDetailPanel valve={selectedValve} onClose={handleClosePanel} />
      )}

      {/* 선택된 밸브 플로팅 버튼 (패널 닫힌 상태) */}
      {selectedValve && !showDetailPanel && (
        <button
          onClick={() => setShowDetailPanel(true)}
          className="absolute bottom-20 md:bottom-auto md:top-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-8 z-30 bg-[#1c1f27]/95 md:bg-[#1c1f27]/90 backdrop-blur-xl border border-white/10 rounded-full md:rounded-lg shadow-2xl px-4 py-3 hover:bg-[#1c1f27] active:scale-95 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary !text-[20px]">valve</span>
            </div>
            <div className="text-left">
              <div className="text-white font-semibold text-sm md:text-base">{selectedValve.tag}</div>
              <div className="text-[#9da6b9] text-xs">{selectedValve.type || selectedValve.tag.split('-')[0]} · 탭하여 상세보기</div>
            </div>
            <span className="material-symbols-outlined text-[#9da6b9] group-hover:text-primary transition-colors !text-[20px]">
              open_in_full
            </span>
          </div>
        </button>
      )}

      {/* 하단 정보 */}
      <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 bg-[#1c1f27]/80 backdrop-blur-md border border-white/10 rounded-lg shadow-lg px-3 md:px-4 py-2 pointer-events-auto">
        <div className="text-xs md:text-sm text-[#9da6b9]">
          총 <span className="text-white font-semibold">{valves.length.toLocaleString()}</span>개 밸브
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
