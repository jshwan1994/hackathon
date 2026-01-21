"use client";

import { ValveData } from "@/types/valve";
import Valve3DViewer from "./Valve3DViewer";

interface ValveDetailPanelProps {
  valve: ValveData;
  onClose: () => void;
}

export default function ValveDetailPanel({ valve, onClose }: ValveDetailPanelProps) {
  const statusColor = {
    operational: "bg-green-500/20 text-green-400 border-green-500/30",
    maintenance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    offline: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusText = {
    operational: "정상 작동",
    maintenance: "점검 중",
    offline: "작동 중지",
  };

  return (
    <div className="absolute top-0 right-0 h-full w-[400px] z-30 transform transition-transform duration-300 ease-out translate-x-0 bg-[#111318]/60 backdrop-blur-2xl border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-start justify-between p-6 pb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary/20 text-primary p-1.5 rounded-lg">
              <span className="material-symbols-outlined !text-[20px]">valve</span>
            </div>
            <span className="text-xs font-bold tracking-wider text-primary uppercase">
              선택된 밸브
            </span>
          </div>
          <h1 className="text-white text-2xl font-bold leading-tight">{valve.tag}</h1>
          <p className="text-[#9da6b9] text-sm">{valve.location}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#9da6b9] hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2 space-y-6">
        {/* 3D 모델 미리보기 */}
        <Valve3DViewer valveType={valve.type || 'VG'} />

        {/* 상태 표시 */}
        <div className="bg-[#1c1f27]/50 border border-white/5 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-2 rounded-full ${valve.status === 'operational' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`}></div>
            <span className="text-sm font-medium text-white">
              {statusText[valve.status || 'operational']}
            </span>
          </div>
          {valve.lastInspected && (
            <span className="text-xs text-[#9da6b9]">
              마지막 점검: {valve.lastInspected}
            </span>
          )}
        </div>

        {/* 기술 사양 */}
        <div className="space-y-4">
          <h3 className="text-white text-sm font-semibold px-1">기술 사양</h3>
          <div className="bg-[#1c1f27]/30 rounded-xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-2 gap-px bg-white/5">
              <div className="bg-[#1c1f27]/80 p-4 hover:bg-[#1c1f27] transition-colors">
                <p className="text-[#9da6b9] text-xs mb-1">압력 등급</p>
                <p className="text-white text-sm font-mono font-medium">
                  {valve.specs?.pressureRating || "-"}
                </p>
              </div>
              <div className="bg-[#1c1f27]/80 p-4 hover:bg-[#1c1f27] transition-colors">
                <p className="text-[#9da6b9] text-xs mb-1">온도 범위</p>
                <p className="text-white text-sm font-mono font-medium">
                  {valve.specs?.temperature || "-"}
                </p>
              </div>
              <div className="bg-[#1c1f27]/80 p-4 hover:bg-[#1c1f27] transition-colors">
                <p className="text-[#9da6b9] text-xs mb-1">재질</p>
                <p className="text-white text-sm font-mono font-medium">
                  {valve.specs?.material || "-"}
                </p>
              </div>
              <div className="bg-[#1c1f27]/80 p-4 hover:bg-[#1c1f27] transition-colors">
                <p className="text-[#9da6b9] text-xs mb-1">유량 계수</p>
                <p className="text-white text-sm font-mono font-medium">
                  {valve.specs?.flowCoeff || "-"}
                </p>
              </div>
              <div className="bg-[#1c1f27]/80 p-4 col-span-2 hover:bg-[#1c1f27] transition-colors border-t border-white/5">
                <p className="text-[#9da6b9] text-xs mb-1">제조사 ID</p>
                <p className="text-white text-sm font-mono font-medium">
                  {valve.specs?.manufacturerId || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 위치 정보 */}
        <div className="space-y-3">
          <h3 className="text-white text-sm font-semibold px-1">위치 정보</h3>
          <div className="bg-[#1c1f27]/30 rounded-xl border border-white/5 p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <div>
                <p className="text-white font-medium text-sm mb-1">설치 위치</p>
                <p className="text-[#9da6b9] text-sm">{valve.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 관련 문서 */}
        <div className="space-y-3">
          <h3 className="text-white text-sm font-semibold px-1">관련 문서</h3>
          <button className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1c1f27]/30 border border-white/5 hover:bg-[#1c1f27]/60 hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                description
              </span>
              <span className="text-sm text-[#9da6b9] group-hover:text-white">
                P&ID 도면
              </span>
            </div>
            <span className="material-symbols-outlined text-[#9da6b9] !text-[18px]">
              open_in_new
            </span>
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1c1f27]/30 border border-white/5 hover:bg-[#1c1f27]/60 hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                history
              </span>
              <span className="text-sm text-[#9da6b9] group-hover:text-white">
                점검 이력
              </span>
            </div>
            <span className="material-symbols-outlined text-[#9da6b9] !text-[18px]">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      {/* 하단 액션 버튼 */}
      <div className="p-6 pt-4 border-t border-white/10 bg-[#111318]/40">
        <button className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-primary hover:bg-blue-600 text-white font-semibold tracking-wide shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98]">
          <span className="material-symbols-outlined !text-[20px]">near_me</span>
          도면에서 위치 보기
        </button>
      </div>
    </div>
  );
}
