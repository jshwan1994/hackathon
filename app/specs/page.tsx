"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ValveSpec {
  tag: string;
  valve_type: string;
  type: string;
  class: string;
  size: string;
  material: string;
  vendor: string;
}

interface SpecsData {
  extraction_date: string;
  total_valves: number;
  valves: ValveSpec[];
}

const TYPE_COLORS: Record<string, string> = {
  GATE: '#3b82f6',
  GLOBE: '#8b5cf6',
  BALL: '#10b981',
  CHECK: '#f59e0b',
  BUTTERFLY: '#ec4899',
  NEEDLE: '#06b6d4',
  SAFETY: '#dc2626',
  RELIEF: '#ef4444',
  PLUG: '#84cc16',
  ANGLE: '#a855f7',
};

// 태그 접두사로 밸브 타입 추론
const TAG_PREFIX_TO_TYPE: Record<string, string> = {
  VG: 'GATE',
  VL: 'GLOBE',
  VC: 'CHECK',
  VB: 'BALL',
  VN: 'NEEDLE',
  VF: 'BUTTERFLY',
  VP: 'PLUG',
  VA: 'ANGLE',
  PSV: 'SAFETY',
  PRV: 'RELIEF',
  TCV: 'CONTROL',
  FCV: 'CONTROL',
  PCV: 'CONTROL',
  LCV: 'CONTROL',
  XV: 'ON/OFF',
  CV: 'CONTROL',
};

function inferTypeFromTag(tag: string, existingType?: string): string {
  if (existingType) return existingType;

  // 태그에서 접두사 추출 (예: VG-5253 -> VG, PSV-001 -> PSV)
  const match = tag.match(/^([A-Z]+)/);
  if (match) {
    const prefix = match[1];
    return TAG_PREFIX_TO_TYPE[prefix] || '';
  }
  return '';
}

export default function SpecsPage() {
  const [specsData, setSpecsData] = useState<SpecsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/valve_specs_merged.json')
      .then(res => res.json())
      .then(data => {
        setSpecsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load specs:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f12] flex items-center justify-center">
        <div className="text-[#9da6b9]">로딩 중...</div>
      </div>
    );
  }

  if (!specsData) {
    return (
      <div className="min-h-screen bg-[#0d0f12] flex items-center justify-center">
        <div className="text-[#9da6b9]">데이터를 불러올 수 없습니다</div>
      </div>
    );
  }

  // 타입 추론 적용된 밸브 데이터
  const valvesWithInferredType = specsData.valves.map(valve => ({
    ...valve,
    inferredType: inferTypeFromTag(valve.tag, valve.type),
  }));

  // Get unique types for filter (추론된 타입 포함)
  const uniqueTypes = Array.from(new Set(valvesWithInferredType.map(v => v.inferredType).filter(Boolean))).sort();

  // Filter valves
  const filteredValves = valvesWithInferredType.filter(valve => {
    // Type filter
    if (typeFilter !== 'all' && valve.inferredType !== typeFilter) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        valve.tag.toLowerCase().includes(query) ||
        valve.inferredType?.toLowerCase().includes(query) ||
        valve.material?.toLowerCase().includes(query) ||
        valve.vendor?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#0d0f12]">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-[#0d0f12]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#9da6b9] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-white text-xl font-bold">밸브 기술사양</h1>
                <p className="text-[#9da6b9] text-sm">Valve Specifications</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[#9da6b9] text-sm">
                총 <span className="text-white font-semibold">{filteredValves.length}</span>개
                {filteredValves.length !== specsData.total_valves && (
                  <span className="text-[#6b7280]"> / {specsData.total_valves}개</span>
                )}
              </span>
            </div>
          </div>

          {/* 검색창 */}
          <div className="relative mb-3">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9da6b9]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Glance... (예: VG, HV, PI, TI, 4302, 6110)"
              className="w-full h-12 pl-12 pr-4 bg-[#1c1f27] border border-white/10 rounded-xl text-white placeholder-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                title="검색어 지우기"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9da6b9] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* 타입 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                typeFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-[#9da6b9] hover:bg-white/10 hover:text-white'
              }`}
            >
              전체
            </button>
            {uniqueTypes.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  typeFilter === type
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-[#9da6b9] hover:bg-white/10 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 테이블 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredValves.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1c1f27] text-[#9da6b9] text-left">
                  <th className="px-4 py-3 font-semibold border-b border-white/10">태그</th>
                  <th className="px-4 py-3 font-semibold border-b border-white/10">타입</th>
                  <th className="px-4 py-3 font-semibold border-b border-white/10">밸브종류</th>
                  <th className="px-4 py-3 font-semibold border-b border-white/10">압력등급</th>
                  <th className="px-4 py-3 font-semibold border-b border-white/10">크기</th>
                  <th className="px-4 py-3 font-semibold border-b border-white/10">재질</th>
                  <th className="px-4 py-3 font-semibold border-b border-white/10">제조사</th>
                </tr>
              </thead>
              <tbody>
                {filteredValves.map((valve, index) => {
                  const displayType = valve.inferredType || '-';
                  const typeColor = TYPE_COLORS[displayType] || '#6b7280';
                  return (
                    <tr
                      key={valve.tag}
                      className={`${
                        index % 2 === 0 ? 'bg-[#0d0f12]' : 'bg-[#1c1f27]/50'
                      } hover:bg-[#252830] transition-colors`}
                    >
                      <td className="px-4 py-3 text-white font-mono font-medium">{valve.tag}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                        >
                          {displayType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#9da6b9]">{valve.valve_type || '-'}</td>
                      <td className="px-4 py-3 text-[#9da6b9]">{valve.class || '-'}</td>
                      <td className="px-4 py-3 text-[#9da6b9]">{valve.size ? `${valve.size}A` : '-'}</td>
                      <td className="px-4 py-3 text-[#9da6b9]">{valve.material || '-'}</td>
                      <td className="px-4 py-3 text-[#9da6b9]">{valve.vendor || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-[#9da6b9] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
            </svg>
            <p className="text-[#9da6b9]">검색 결과가 없습니다</p>
          </div>
        )}
      </main>
    </div>
  );
}
