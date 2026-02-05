"use client";

import { useState } from "react";
import Link from "next/link";
import {
  componentDictionary,
  valveDictionary,
  instrumentDictionary,
  DictionaryEntry,
} from "@/lib/componentDictionary";

type CategoryFilter = 'all' | 'valve' | 'safety' | 'control' | 'instrument';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: '전체',
  valve: '밸브',
  safety: '안전밸브',
  control: '조절밸브',
  instrument: '계기류',
};

const CATEGORY_COLORS: Record<DictionaryEntry['category'], string> = {
  valve: '#3b82f6',
  safety: '#dc2626',
  control: '#8b5cf6',
  instrument: '#10b981',
};

export default function DictionaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // 필터링된 사전 항목
  const filteredEntries = componentDictionary.filter(entry => {
    // 카테고리 필터
    if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
      return false;
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        entry.code.toLowerCase().includes(query) ||
        entry.name.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // 카테고리별 그룹핑
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const category = entry.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(entry);
    return acc;
  }, {} as Record<string, DictionaryEntry[]>);

  const categoryOrder: DictionaryEntry['category'][] = ['valve', 'safety', 'control', 'instrument'];

  return (
    <div className="min-h-screen bg-[#0d0f12]">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-[#0d0f12]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#9da6b9] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined !text-[20px]">arrow_back</span>
              </Link>
              <div>
                <h1 className="text-white text-xl font-bold">밸브/계기 사전</h1>
                <p className="text-[#9da6b9] text-sm">P&ID 심볼 코드 설명</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[#9da6b9] text-sm">
                총 <span className="text-white font-semibold">{filteredEntries.length}</span>개 항목
              </span>
            </div>
          </div>

          {/* 검색창 */}
          <div className="relative mb-3">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9da6b9]">
              <span className="material-symbols-outlined !text-[20px]">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="코드 또는 이름으로 검색... (예: PSV, 압력)"
              className="w-full h-12 pl-12 pr-4 bg-[#1c1f27] border border-white/10 rounded-xl text-white placeholder-[#9da6b9] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9da6b9] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined !text-[20px]">close</span>
              </button>
            )}
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  categoryFilter === category
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-[#9da6b9] hover:bg-white/10 hover:text-white'
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 사전 목록 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {categoryFilter === 'all' ? (
          // 카테고리별 그룹 표시
          <div className="space-y-8">
            {categoryOrder.map((category) => {
              const entries = groupedEntries[category];
              if (!entries || entries.length === 0) return null;

              const categoryLabel = {
                valve: '일반 밸브',
                safety: '안전밸브',
                control: '조절밸브',
                instrument: '계기류',
              }[category];

              return (
                <section key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category] }}
                    />
                    <h2 className="text-white font-semibold">{categoryLabel}</h2>
                    <span className="text-[#9da6b9] text-sm">({entries.length})</span>
                  </div>
                  <div className="grid gap-3">
                    {entries.map((entry) => (
                      <DictionaryCard key={entry.code} entry={entry} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          // 필터된 목록 표시
          <div className="grid gap-3">
            {filteredEntries.map((entry) => (
              <DictionaryCard key={entry.code} entry={entry} />
            ))}
          </div>
        )}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined !text-[48px] text-[#9da6b9] mb-4 block">
              search_off
            </span>
            <p className="text-[#9da6b9]">검색 결과가 없습니다</p>
          </div>
        )}
      </main>
    </div>
  );
}

function DictionaryCard({ entry }: { entry: DictionaryEntry }) {
  const color = CATEGORY_COLORS[entry.category];

  return (
    <div className="bg-[#1c1f27] rounded-xl border border-white/10 p-4 hover:bg-[#252830] transition-colors">
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {entry.code}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold">{entry.name}</h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {entry.code}
            </span>
          </div>
          <p className="text-[#9da6b9] text-sm leading-relaxed">{entry.description}</p>
        </div>
      </div>
    </div>
  );
}
