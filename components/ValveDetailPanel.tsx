"use client";

import { useState, useEffect } from "react";
import { ValveData, CATEGORY_CONFIG } from "@/types/valve";
import Valve3DViewer from "./Valve3DViewer";
import CategoryIcon from "./CategoryIcon";
import Link from "next/link";
import {
  diaryRecords,
  formatShift,
} from "@/lib/diaryData";
import {
  MaintenanceRecord,
  fetchMaintenanceHistory,
  formatMaintenanceDate,
  getStatusColor,
} from "@/lib/maintenanceData";
import {
  getIsolationProcedure,
  getActionColor,
  getActionIcon,
} from "@/lib/isolationData";

interface ValveDetailPanelProps {
  valve: ValveData;
  onClose: () => void;
}

// PDF에서 추출한 실제 밸브 사양 타입
interface ValveSpec {
  tag: string;
  valve_type: string;
  class: string | null;
  size: string | null;
  material: string | null;
  vendor: string;
}

// 계기류 타입별 사양 (계기류는 PDF에 없으므로 유지)
const instrumentSpecs: Record<string, { range: string; unit: string; signal: string; manufacturer: string }> = {
  PI: { range: "0 ~ 50", unit: "kg/cm²", signal: "4-20mA", manufacturer: "Rosemount" },
  TI: { range: "0 ~ 500", unit: "°C", signal: "4-20mA", manufacturer: "Rosemount" },
  FI: { range: "0 ~ 1000", unit: "m³/h", signal: "4-20mA", manufacturer: "Yokogawa" },
  LI: { range: "0 ~ 100", unit: "%", signal: "4-20mA", manufacturer: "Endress+Hauser" },
  PT: { range: "0 ~ 100", unit: "kg/cm²", signal: "4-20mA", manufacturer: "Rosemount" },
  TT: { range: "-50 ~ 600", unit: "°C", signal: "4-20mA", manufacturer: "Rosemount" },
  FT: { range: "0 ~ 2000", unit: "m³/h", signal: "4-20mA", manufacturer: "Yokogawa" },
  LT: { range: "0 ~ 100", unit: "%", signal: "4-20mA", manufacturer: "Endress+Hauser" },
  PSV: { range: "설정압력", unit: "kg/cm²", signal: "기계식", manufacturer: "Consolidated" },
  TCV: { range: "0 ~ 100", unit: "%", signal: "4-20mA", manufacturer: "Fisher" },
  FCV: { range: "0 ~ 100", unit: "%", signal: "4-20mA", manufacturer: "Fisher" },
  PCV: { range: "0 ~ 100", unit: "%", signal: "4-20mA", manufacturer: "Fisher" },
  LCV: { range: "0 ~ 100", unit: "%", signal: "4-20mA", manufacturer: "Fisher" },
};

// 밸브 카테고리인지 확인 (3D 모델 표시용 - 안전밸브 제외)
function isValveCategory(category?: string): boolean {
  return category === 'Valve' || category === 'Control Valve';
}

// 안전밸브인지 확인
function isSafetyValve(category?: string): boolean {
  return category === 'Safety Valve';
}

export default function ValveDetailPanel({ valve, onClose }: ValveDetailPanelProps) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const [valveSpec, setValveSpec] = useState<ValveSpec | null>(null);
  const [loadingSpec, setLoadingSpec] = useState(true);

  const isValve = isValveCategory(valve.category);
  const isSafety = isSafetyValve(valve.category);
  const instSpecs = instrumentSpecs[valve.type || 'PI'] || instrumentSpecs.PI;
  const categoryConfig = CATEGORY_CONFIG[valve.category || 'Other'] || CATEGORY_CONFIG['Other'];
  const isolationProcedure = getIsolationProcedure(valve.tag);

  // PDF에서 추출한 밸브 사양 로드
  useEffect(() => {
    const loadValveSpec = async () => {
      setLoadingSpec(true);
      try {
        const res = await fetch('/data/valve_specs_merged.json');
        const data = await res.json();
        const spec = data.valves.find((v: ValveSpec) => v.tag === valve.tag);
        setValveSpec(spec || null);
      } catch (error) {
        console.error('Failed to load valve specs:', error);
        setValveSpec(null);
      }
      setLoadingSpec(false);
    };

    if (isValve || isSafety) {
      loadValveSpec();
    } else {
      setLoadingSpec(false);
    }
  }, [valve.tag, isValve, isSafety]);

  // 정비이력 API 호출
  useEffect(() => {
    const loadMaintenanceHistory = async () => {
      setLoadingMaintenance(true);
      const data = await fetchMaintenanceHistory(valve.tag);
      setMaintenanceRecords(data);
      setLoadingMaintenance(false);
    };

    loadMaintenanceHistory();
  }, [valve.tag]);

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
              <div
                className="px-2 py-1 rounded-lg"
                style={{ backgroundColor: `${categoryConfig.color}20` }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: categoryConfig.color }}
                >
                  {valve.type}
                </span>
              </div>
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: categoryConfig.color }}
              >
                {categoryConfig.label}
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
          {/* 밸브인 경우 3D 뷰어 표시 (안전밸브 제외) */}
          {isValve && !isSafety && (
            <Valve3DViewer valveType={valve.type || 'VG'} fluidType={valveSpec?.valve_type || 'Steam'} />
          )}

          {/* 안전밸브인 경우 아이콘 표시 */}
          {isSafety && (
            <div className="bg-[#1c1f27] rounded-xl border border-white/10 p-6 flex flex-col items-center justify-center">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${categoryConfig.color}20` }}
              >
                <CategoryIcon category="Safety Valve" size={56} color={categoryConfig.color} />
              </div>
              <p className="text-white font-semibold text-lg">{valve.type}</p>
              <p className="text-[#9da6b9] text-sm">{categoryConfig.label}</p>
            </div>
          )}

          {/* 계기류인 경우 타입/카테고리 표시 */}
          {!isValve && !isSafety && (
            <div className="bg-[#1c1f27] rounded-xl border border-white/10 p-6 flex flex-col items-center justify-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${categoryConfig.color}20` }}
              >
                <span
                  className="text-3xl font-bold"
                  style={{ color: categoryConfig.color }}
                >
                  {valve.type}
                </span>
              </div>
              <p className="text-white font-semibold">{categoryConfig.label}</p>
              <p className="text-[#9da6b9] text-sm">{categoryConfig.label} 계기</p>
            </div>
          )}

          {/* 기술 사양 - 밸브 (안전밸브 포함) */}
          {(isValve || isSafety) && (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-white text-sm font-semibold">기술 사양</h3>
                {loadingSpec ? (
                  <span className="text-xs text-[#9da6b9] bg-white/5 px-2 py-0.5 rounded-full">로딩중...</span>
                ) : valveSpec ? (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">PDF 데이터</span>
                ) : (
                  <span className="text-xs text-[#9da6b9] bg-white/5 px-2 py-0.5 rounded-full">데이터 없음</span>
                )}
              </div>
              <div className="bg-[#1c1f27] rounded-xl border border-white/10 overflow-hidden">
                {loadingSpec ? (
                  <div className="p-6 text-center text-[#9da6b9] text-sm">
                    <div className="animate-pulse">사양 정보를 불러오는 중...</div>
                  </div>
                ) : valveSpec ? (
                  <div className="grid grid-cols-2 gap-[1px] bg-white/20">
                    <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                      <p className="text-[#9da6b9] text-xs mb-0.5">압력 등급 (Class)</p>
                      <p className="text-white text-sm font-medium">{valveSpec.class || '-'}</p>
                    </div>
                    <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                      <p className="text-[#9da6b9] text-xs mb-0.5">사이즈 (Size)</p>
                      <p className="text-white text-sm font-medium">{valveSpec.size ? `${valveSpec.size}A` : '-'}</p>
                    </div>
                    <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                      <p className="text-[#9da6b9] text-xs mb-0.5">재질 (Material)</p>
                      <p className="text-white text-sm font-medium">{valveSpec.material || '-'}</p>
                    </div>
                    <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                      <p className="text-[#9da6b9] text-xs mb-0.5">제조사 (Vendor)</p>
                      <p className="text-white text-sm font-medium">{valveSpec.vendor || '-'}</p>
                    </div>
                    <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors col-span-2">
                      <p className="text-[#9da6b9] text-xs mb-0.5">밸브 종류 (Type)</p>
                      <p className="text-white text-sm font-medium">{valveSpec.valve_type || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-[#9da6b9] text-sm">
                    이 밸브의 사양 정보가 없습니다
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 기술 사양 - 계기류 */}
          {!isValve && !isSafety && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-white text-sm font-semibold px-1">계기 사양</h3>
              <div className="bg-[#1c1f27] rounded-xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-2 gap-[1px] bg-white/20">
                  <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                    <p className="text-[#9da6b9] text-xs mb-0.5">측정 범위</p>
                    <p className="text-white text-sm font-medium">{instSpecs.range} {instSpecs.unit}</p>
                  </div>
                  <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                    <p className="text-[#9da6b9] text-xs mb-0.5">단위</p>
                    <p className="text-white text-sm font-medium">{instSpecs.unit}</p>
                  </div>
                  <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                    <p className="text-[#9da6b9] text-xs mb-0.5">출력 신호</p>
                    <p className="text-white text-sm font-medium">{instSpecs.signal}</p>
                  </div>
                  <div className="bg-[#1c1f27] p-3 hover:bg-[#252830] transition-colors">
                    <p className="text-[#9da6b9] text-xs mb-0.5">제조사</p>
                    <p className="text-white text-sm font-medium">{instSpecs.manufacturer}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 정비이력 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-white text-sm font-semibold">정비이력</h3>
              {loadingMaintenance ? (
                <span className="text-xs text-[#9da6b9] bg-white/5 px-2 py-0.5 rounded-full">
                  로딩중...
                </span>
              ) : (
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {maintenanceRecords.length}건
                </span>
              )}
            </div>
            <div className="bg-[#1c1f27] rounded-xl border border-white/10 overflow-hidden">
              {loadingMaintenance ? (
                <div className="p-6 text-center text-[#9da6b9] text-sm">
                  <div className="animate-pulse">정비이력을 불러오는 중...</div>
                </div>
              ) : maintenanceRecords.length === 0 ? (
                <div className="p-8 flex items-center justify-center">
                  <p className="text-[#9da6b9] text-sm">최근 6개월간 정비이력 없음</p>
                </div>
              ) : (
                maintenanceRecords.map((record, index) => (
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
                    <div className="flex items-center justify-between text-xs text-[#9da6b9]">
                      <span>{record.department} {record.requester}</span>
                      <span className="font-mono text-[10px]">{record.equipment}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 점검시 조작사항 - 밸브에만 표시 */}
          {(isValve || isSafety) && isolationProcedure && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-white text-sm font-semibold">점검시 조작사항</h3>
                <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                  {isolationProcedure.steps.length}단계
                </span>
              </div>
              <div className="bg-[#1c1f27] rounded-xl border border-white/10 overflow-hidden">
                {isolationProcedure.steps.map((step, index) => (
                  <div
                    key={step.step}
                    className={`p-3 hover:bg-[#252830] transition-colors ${index !== isolationProcedure.steps.length - 1 ? 'border-b border-white/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white text-xs font-bold shrink-0 mt-0.5">
                        {step.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getActionColor(step.action)}`}>
                            {step.action}
                          </span>
                          {step.valve && (
                            <span className="text-xs font-mono text-primary">{step.valve}</span>
                          )}
                          {step.direction && (
                            <span className="text-[10px] text-[#9da6b9]">
                              ({step.direction === 'upstream' ? '전단' : step.direction === 'downstream' ? '후단' : '드레인'})
                            </span>
                          )}
                        </div>
                        <p className="text-white text-sm leading-relaxed">{step.description_ko}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* 위치 정보 + 로드뷰 */}
          <div className="space-y-3">
            <h3 className="text-white text-sm font-semibold px-1">위치 정보</h3>
            <div className="bg-[#1c1f27] rounded-xl border border-white/10 p-4">
              <p className="text-white text-sm mb-3">{valve.location}</p>
              <Link
                href="/roadview"
                target="_blank"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
              >
                <span className="text-primary text-sm">360°</span>
                <span className="text-primary text-sm font-medium">ST동 로드뷰 보기</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
