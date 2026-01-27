"use client";

import { ValveData } from "@/types/valve";
import Valve3DViewer from "./Valve3DViewer";
import {
  diaryRecords,
  formatShift,
} from "@/lib/diaryData";
import {
  maintenanceRecords,
  formatMaintenanceDate,
  getStatusColor,
} from "@/lib/maintenanceData";

interface ValveDetailPanelProps {
  valve: ValveData;
  onClose: () => void;
}

// 밸브 타입별 목업 기술 사양
const mockSpecs: Record<string, { pressureRating: string; temperature: string; manufacturerId: string; fluid: string }> = {
  VC: { pressureRating: "20 kg/cm²", temperature: "-29°C ~ 200°C", manufacturerId: "FV-2024-0581", fluid: "응축수" },
  VL: { pressureRating: "50 kg/cm²", temperature: "-29°C ~ 250°C", manufacturerId: "FV-2024-0603", fluid: "Steam" },
  VG: { pressureRating: "20 kg/cm²", temperature: "-29°C ~ 180°C", manufacturerId: "FV-2024-0583", fluid: "급수" },
  VB: { pressureRating: "100 kg/cm²", temperature: "-46°C ~ 300°C", manufacturerId: "FV-2024-4301", fluid: "Steam" },
  FV: { pressureRating: "50 kg/cm²", temperature: "-29°C ~ 220°C", manufacturerId: "FV-2024-7014", fluid: "급수" },
  FCV: { pressureRating: "50 kg/cm²", temperature: "-29°C ~ 200°C", manufacturerId: "CV-2024-7011", fluid: "Steam" },
  LCV: { pressureRating: "20 kg/cm²", temperature: "-29°C ~ 180°C", manufacturerId: "CV-2024-7011", fluid: "응축수" },
  HV: { pressureRating: "50 kg/cm²", temperature: "-46°C ~ 250°C", manufacturerId: "HV-2024-7011", fluid: "급수" },
};

export default function ValveDetailPanel({ valve, onClose }: ValveDetailPanelProps) {
  const specs = mockSpecs[valve.type || 'VG'] || mockSpecs.VG;

  return (
    <>
      <div
        className="md:hidden fixed inset-0 bg-black/50 z-20"
        onClick={onClose}
      />

      <div className="fixed md:absolute inset-x-0 bottom-0 md:inset-auto md:top-0 md:right-0 md:h-full h-[85vh] w-full md:w-[400px] z-30 transform transition-transform duration-300 ease-out translate-x-0 bg-[#111318] md:border-l border-t md:border-t-0 border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col rounded-t-2xl md:rounded-none">
        <div className="md:hidden flex justify-center py-3">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-start justify-between p-4 md:p-6 pb-2">
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pt-2 space-y-4 md:space-y-6">
          <Valve3DViewer valveType={valve.type || 'VG'} fluidType={specs.fluid} />

          {/* 기술 사양 */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-white text-sm font-semibold px-1">기술 사양</h3>
            <div className="bg-[#1c1f27] rounded-xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-2 gap-[1px] bg-white/20">
                <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                  <p className="text-[#9da6b9] text-xs mb-0.5">압력 등급</p>
                  <p className="text-white text-sm font-medium">{specs.pressureRating}</p>
                </div>
                <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                  <p className="text-[#9da6b9] text-xs mb-0.5">온도 범위</p>
                  <p className="text-white text-sm font-medium">{specs.temperature}</p>
                </div>
                <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                  <p className="text-[#9da6b9] text-xs mb-0.5">유체</p>
                  <p className="text-white text-sm font-medium">{specs.fluid}</p>
                </div>
                <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                  <p className="text-[#9da6b9] text-xs mb-0.5">제조사 ID</p>
                  <p className="text-white text-sm font-medium">{specs.manufacturerId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 정비이력 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-white text-sm font-semibold">정비이력</h3>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {maintenanceRecords.length}건
              </span>
            </div>
            <div className="bg-[#1c1f27] rounded-xl border border-white/10 overflow-hidden">
              {maintenanceRecords.map((record, index) => (
                <div
                  key={record.permittowork}
                  className={`p-3 hover:bg-[#252830] transition-colors ${index !== maintenanceRecords.length - 1 ? 'border-b border-white/10' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary">#{record.permittowork}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                    <span className="text-[#9da6b9] text-xs">
                      {formatMaintenanceDate(record.daterequired)}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-relaxed mb-2">{record.description}</p>
                  <div className="text-xs text-[#9da6b9]">
                    {record.department} {record.requester} 매니저
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 인계일지 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-white text-sm font-semibold">인계일지</h3>
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {diaryRecords.length}건
              </span>
            </div>
            <div className="bg-[#1c1f27] rounded-xl border border-white/10 overflow-hidden">
              {diaryRecords.map((diary, index) => (
                <div
                  key={diary.diary_id}
                  className={`p-3 hover:bg-[#252830] transition-colors ${index !== diaryRecords.length - 1 ? 'border-b border-white/10' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${diary.shift === 'DAY' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {formatShift(diary.shift)}
                      </span>
                      <span className="text-[#9da6b9] text-xs">{diary.date}</span>
                    </div>
                    <span className="text-[#9da6b9] text-xs">{diary.writer_name}</span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{diary.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 위치 정보 */}
          <div className="space-y-3">
            <h3 className="text-white text-sm font-semibold px-1">위치 정보</h3>
            <div className="bg-[#1c1f27] rounded-xl border border-white/10 p-4">
              <p className="text-white text-sm">{valve.location}</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
