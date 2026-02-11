"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { ValveData, CATEGORY_CONFIG } from "@/types/valve";
import { searchValves } from "@/lib/valveData";
import ValveDetailPanel from "@/components/ValveDetailPanel";
import DrawingViewer from "@/components/DrawingViewer";
import CategoryIcon from "@/components/CategoryIcon";

export default function Home() {
  const [valves, setValves] = useState<ValveData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ValveData[]>([]);
  const [selectedValve, setSelectedValve] = useState<ValveData | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [specCount, setSpecCount] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [maintenanceTotal, setMaintenanceTotal] = useState(0);

  // 컴포넌트 데이터 로드 (밸브 + 계기류)
  useEffect(() => {
    async function loadComponentData() {
      try {
        const response = await fetch("/data/all_components.json");
        const data = await response.json();
        setValves(data);
      } catch (error) {
        console.error("컴포넌트 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    loadComponentData();
  }, []);

  // 밸브 사양 데이터 개수 로드
  useEffect(() => {
    async function loadSpecCount() {
      try {
        const response = await fetch("/data/valve_specs_merged.json");
        const data = await response.json();
        setSpecCount(data.total_valves || 0);
      } catch (error) {
        console.error("밸브 사양 데이터 로드 실패:", error);
      }
    }
    loadSpecCount();
  }, []);

  // 정비이력 데이터 개수 로드
  useEffect(() => {
    async function loadMaintenanceCount() {
      try {
        const response = await fetch("/api/maintenance");
        const data = await response.json();
        setMaintenanceCount(data.matchedWithGlance || 0);  // GLANCE와 매칭된 건수
        setMaintenanceTotal(data.total || 0);  // 전체 정비이력 건수
      } catch (error) {
        console.error("정비이력 데이터 로드 실패:", error);
      }
    }
    loadMaintenanceCount();
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

      {/* 사전 카드 + 사양 데이터 - 왼쪽 상단 */}
      <div className="hidden md:flex absolute top-8 left-8 z-20 flex-col gap-3 pointer-events-auto">
        <Link
          href="/dictionary"
          className="flex items-center gap-3 h-14 px-5 bg-[#1c1f27]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:bg-[#1c1f27] hover:border-primary/30 transition-all duration-300 group"
        >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors relative overflow-hidden">
          <svg className="w-5 h-5 text-primary relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <div className="shine-effect"></div>
        </div>
        <div className="text-white font-semibold text-sm">밸브/계기 사전</div>
        </Link>

        {/* 밸브 기술사양 데이터 현황 */}
        <div className="flex items-center gap-3 h-14 px-5 bg-[#1c1f27]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <div className="text-white font-semibold text-sm">밸브 기술사양 {specCount.toLocaleString()}개</div>
        </div>

        {/* 정비이력 데이터 현황 */}
        <div className="flex items-center gap-3 h-14 px-5 bg-[#1c1f27]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <div className="text-white font-semibold text-sm">정비이력 매칭 {maintenanceCount.toLocaleString()}건</div>
        </div>
      </div>

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
                placeholder="밸브/계기 태그 검색... (예: TI, PI, FCV, VG)"
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
              {searchResults.slice(0, 20).map((valve, index) => {
                const config = CATEGORY_CONFIG[valve.category || 'Other'] || CATEGORY_CONFIG['Other'];
                return (
                  <button
                    key={`${valve.tag}-${index}`}
                    onClick={() => handleValveSelect(valve)}
                    className="w-full px-4 md:px-6 py-3 text-left hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5 last:border-b-0 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${config.color}15` }}
                      >
                        <CategoryIcon category={valve.category || 'Other'} size={20} color={config.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm md:text-base">{valve.tag}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                            style={{ backgroundColor: `${config.color}20`, color: config.color }}
                          >
                            {config.label}
                          </span>
                        </div>
                        <div className="text-[#9da6b9] text-xs md:text-sm truncate">{valve.location}</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-[#9da6b9] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
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

      {/* 선택된 컴포넌트 플로팅 버튼 (패널 닫힌 상태) */}
      {selectedValve && !showDetailPanel && (() => {
        const config = CATEGORY_CONFIG[selectedValve.category || 'Other'] || CATEGORY_CONFIG['Other'];
        return (
          <button
            onClick={() => setShowDetailPanel(true)}
            className="absolute bottom-20 md:bottom-auto md:top-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-8 z-30 bg-[#1c1f27]/95 md:bg-[#1c1f27]/90 backdrop-blur-xl border border-white/10 rounded-full md:rounded-lg shadow-2xl px-4 py-3 hover:bg-[#1c1f27] active:scale-95 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <CategoryIcon category={selectedValve.category || 'Other'} size={22} color={config.color} />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold text-sm md:text-base">{selectedValve.tag}</div>
                <div className="text-[#9da6b9] text-xs">{config.label} · 탭하여 상세보기</div>
              </div>
              <svg className="w-5 h-5 text-[#9da6b9] group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
          </button>
        );
      })()}

      {/* 하단 정보 */}
      <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 pointer-events-auto">
        <div className="bg-[#1c1f27]/80 backdrop-blur-md border border-white/10 rounded-lg shadow-lg px-3 md:px-4 py-2">
          <div className="text-xs md:text-sm text-[#9da6b9]">
            총 <span className="text-white font-semibold">{valves.length.toLocaleString()}</span>개 컴포넌트
            <span className="text-[#6b7280] ml-1">
              (밸브 {valves.filter(v => v.category === 'Valve' || v.category === 'Control Valve' || v.category === 'Safety Valve').length.toLocaleString()} + 계기 {valves.filter(v => v.category !== 'Valve' && v.category !== 'Control Valve' && v.category !== 'Safety Valve').length.toLocaleString()})
            </span>
          </div>
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

        .shine-effect {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shine 2.5s ease-in-out infinite;
        }

        @keyframes shine {
          0% {
            left: -100%;
          }
          50%, 100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
