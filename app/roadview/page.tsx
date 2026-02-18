"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Hotspot } from "@/components/PanoramaViewer";
import { PANORAMA_SCENES } from "@/lib/roadviewScenes";

const PanoramaViewer = dynamic(() => import("@/components/PanoramaViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#111318]">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

// localStorage keys
const HOTSPOT_STORAGE_KEY = "roadview-hotspots";
const HEADING_STORAGE_KEY = "roadview-headings";
const SCENE_OVERRIDES_KEY = "roadview-scene-overrides";
const SCENE_ORDER_KEY = "roadview-scene-order";

function loadSavedHotspots(): Record<string, Hotspot[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HOTSPOT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHotspots(data: Record<string, Hotspot[]>) {
  localStorage.setItem(HOTSPOT_STORAGE_KEY, JSON.stringify(data));
}

function loadSavedHeadings(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HEADING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHeadings(data: Record<string, number>) {
  localStorage.setItem(HEADING_STORAGE_KEY, JSON.stringify(data));
}

type SceneOverride = { label?: string; area?: string };

function loadSceneOverrides(): Record<string, SceneOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SCENE_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSceneOverrides(data: Record<string, SceneOverride>) {
  localStorage.setItem(SCENE_OVERRIDES_KEY, JSON.stringify(data));
}

function loadSceneOrder(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SCENE_ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSceneOrder(order: string[]) {
  localStorage.setItem(SCENE_ORDER_KEY, JSON.stringify(order));
}

export default function RoadviewPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [allHotspots, setAllHotspots] = useState<Record<string, Hotspot[]>>({});
  const [headings, setHeadings] = useState<Record<string, number>>({});
  const [currentYaw, setCurrentYaw] = useState(0);
  const [pendingCoords, setPendingCoords] = useState<{ yaw: number; pitch: number } | null>(null);
  const [hotspotLabel, setHotspotLabel] = useState("");
  const [hotspotType, setHotspotType] = useState<"valve" | "info" | "nav">("valve");
  const [navTargetId, setNavTargetId] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [sceneOverrides, setSceneOverrides] = useState<Record<string, SceneOverride>>({});
  const [editingScene, setEditingScene] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editArea, setEditArea] = useState("");
  const [sceneOrder, setSceneOrder] = useState<string[] | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Load saved hotspots, headings, scene overrides, and scene order on mount
  useEffect(() => {
    setAllHotspots(loadSavedHotspots());
    setHeadings(loadSavedHeadings());
    setSceneOverrides(loadSceneOverrides());
    setSceneOrder(loadSceneOrder());
  }, []);

  // Build ordered scenes list from custom order
  const orderedScenes = useMemo(() => {
    if (!sceneOrder) return PANORAMA_SCENES;
    const sceneMap = new Map(PANORAMA_SCENES.map((s) => [s.id, s]));
    const ordered = sceneOrder.map((id) => sceneMap.get(id)).filter(Boolean) as typeof PANORAMA_SCENES;
    // Append any new scenes not in the saved order
    const orderedIds = new Set(sceneOrder);
    for (const s of PANORAMA_SCENES) {
      if (!orderedIds.has(s.id)) ordered.push(s);
    }
    return ordered;
  }, [sceneOrder]);

  const baseScene = orderedScenes[currentIndex];
  const override = sceneOverrides[baseScene.id];
  const currentScene = {
    ...baseScene,
    label: override?.label || baseScene.label,
    area: override?.area || baseScene.area,
  };

  // Helper to get display scene with overrides applied
  const getSceneDisplay = useCallback((scene: typeof baseScene) => {
    const ov = sceneOverrides[scene.id];
    return {
      ...scene,
      label: ov?.label || scene.label,
      area: ov?.area || scene.area,
    };
  }, [sceneOverrides]);
  const imageUrl = `/panorama/${currentScene.file}`;

  // User-placed hotspots for current scene (nav handled by SVG buttons)
  const hotspots = useMemo<Hotspot[]>(() => {
    return allHotspots[currentScene.id] || [];
  }, [allHotspots, currentScene.id]);

  const handleHotspotClick = useCallback((hs: Hotspot) => {
    if (editMode) {
      // In edit mode, clicking existing hotspot = delete it
      if (confirm(`"${hs.label}" 핫스팟을 삭제하시겠습니까?`)) {
        setAllHotspots((prev) => {
          const updated = { ...prev };
          updated[currentScene.id] = (updated[currentScene.id] || []).filter((h) => h.id !== hs.id);
          saveHotspots(updated);
          return updated;
        });
      }
    } else if (hs.type === "nav" && hs.targetSceneId) {
      // Navigate to target scene
      const targetIdx = orderedScenes.findIndex((s) => s.id === hs.targetSceneId);
      if (targetIdx >= 0) setCurrentIndex(targetIdx);
    }
  }, [editMode, currentScene.id]);

  // Handle panorama click in edit mode
  const handlePanoramaClick = useCallback((coords: { yaw: number; pitch: number }) => {
    setPendingCoords(coords);
    setHotspotLabel("");
  }, []);

  // Confirm and add hotspot
  const confirmHotspot = useCallback(() => {
    if (!pendingCoords || !hotspotLabel.trim()) return;
    if (hotspotType === "nav" && !navTargetId) return;

    const newHotspot: Hotspot = {
      id: `hs_${Date.now()}`,
      label: hotspotLabel.trim(),
      yaw: pendingCoords.yaw,
      pitch: pendingCoords.pitch,
      type: hotspotType,
      sceneId: currentScene.id,
      ...(hotspotType === "nav" && navTargetId ? { targetSceneId: navTargetId } : {}),
    };

    setAllHotspots((prev) => {
      const updated = { ...prev };
      updated[currentScene.id] = [...(updated[currentScene.id] || []), newHotspot];
      saveHotspots(updated);
      return updated;
    });

    setPendingCoords(null);
    setHotspotLabel("");
    setNavTargetId("");
  }, [pendingCoords, hotspotLabel, hotspotType, navTargetId, currentScene.id]);

  const cancelHotspot = useCallback(() => {
    setPendingCoords(null);
    setHotspotLabel("");
  }, []);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setShowThumbnails(false);
    setEditingScene(false);
  };

  // Export all hotspots + headings + scene overrides + scene order as JSON
  const exportHotspots = useCallback(() => {
    const exportData = { hotspots: allHotspots, headings, sceneOverrides, sceneOrder: orderedScenes.map((s) => s.id) };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roadview-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allHotspots, headings, sceneOverrides, orderedScenes]);

  // Import hotspots + headings from JSON
  const importHotspots = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = JSON.parse(ev.target?.result as string);
          // Support both old format (hotspots only) and new format (hotspots + headings)
          if (raw.hotspots) {
            setAllHotspots(raw.hotspots);
            saveHotspots(raw.hotspots);
            if (raw.headings) {
              setHeadings(raw.headings);
              saveHeadings(raw.headings);
            }
            if (raw.sceneOverrides) {
              setSceneOverrides(raw.sceneOverrides);
              saveSceneOverrides(raw.sceneOverrides);
            }
            if (raw.sceneOrder) {
              setSceneOrder(raw.sceneOrder);
              saveSceneOrder(raw.sceneOrder);
            }
          } else {
            setAllHotspots(raw);
            saveHotspots(raw);
          }
          alert("데이터를 불러왔습니다!");
        } catch {
          alert("잘못된 파일 형식입니다.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Count total hotspots
  const totalHotspots = Object.values(allHotspots).reduce((sum, arr) => sum + arr.length, 0);
  const currentSceneHotspots = allHotspots[currentScene.id] || [];

  // Preload adjacent images
  useEffect(() => {
    for (let offset = -2; offset <= 2; offset++) {
      const idx = currentIndex + offset;
      if (idx >= 0 && idx < orderedScenes.length && idx !== currentIndex) {
        const img = new Image();
        img.src = `/panorama/${orderedScenes[idx].file}`;
      }
    }
  }, [currentIndex, orderedScenes]);

  // Keyboard navigation (disabled in edit mode when typing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pendingCoords || editingScene) return; // Don't navigate while editing
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentIndex((i) => Math.min(i + 1, orderedScenes.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "e" || e.key === "E") {
        setEditMode((m) => !m);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingCoords, editingScene, orderedScenes]);

  return (
    <div className="h-screen w-screen bg-[#0a0b0f] flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <span className="text-white text-sm">&larr;</span>
            </Link>
            <div>
              <h1 className="text-white font-bold text-sm">발전소 로드뷰</h1>
              {editMode && editingScene ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="라벨"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSceneOverrides((prev) => {
                          const updated = { ...prev, [baseScene.id]: { ...prev[baseScene.id], label: editLabel.trim() || undefined, area: editArea.trim() || undefined } };
                          saveSceneOverrides(updated);
                          return updated;
                        });
                        setEditingScene(false);
                      }
                      if (e.key === "Escape") setEditingScene(false);
                    }}
                    className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-white text-xs w-28 focus:outline-none focus:border-primary/50"
                  />
                  <input
                    type="text"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    placeholder="영역"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSceneOverrides((prev) => {
                          const updated = { ...prev, [baseScene.id]: { ...prev[baseScene.id], label: editLabel.trim() || undefined, area: editArea.trim() || undefined } };
                          saveSceneOverrides(updated);
                          return updated;
                        });
                        setEditingScene(false);
                      }
                      if (e.key === "Escape") setEditingScene(false);
                    }}
                    className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-white text-xs w-16 focus:outline-none focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSceneOverrides((prev) => {
                        const updated = { ...prev, [baseScene.id]: { ...prev[baseScene.id], label: editLabel.trim() || undefined, area: editArea.trim() || undefined } };
                        saveSceneOverrides(updated);
                        return updated;
                      });
                      setEditingScene(false);
                    }}
                    className="text-primary text-xs font-bold"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <p
                  className={`text-white/50 text-xs ${editMode ? "cursor-pointer hover:text-white/80 underline decoration-dashed underline-offset-2" : ""}`}
                  onClick={() => {
                    if (!editMode) return;
                    setEditLabel(currentScene.label);
                    setEditArea(currentScene.area);
                    setEditingScene(true);
                  }}
                >
                  {currentScene.label} ({currentScene.area})
                  {editMode && <span className="ml-1 text-white/30">클릭하여 수정</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit mode toggle */}
            <button
              type="button"
              onClick={() => { setEditMode(!editMode); setPendingCoords(null); }}
              className={`h-9 rounded-lg px-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                editMode
                  ? "bg-red-500/80 text-white hover:bg-red-500"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              {editMode ? "편집 종료" : "편집 (E)"}
            </button>
            {/* Set heading button (edit mode only) */}
            {editMode && (
              <button
                type="button"
                onClick={() => {
                  setHeadings((prev) => {
                    const updated = { ...prev, [currentScene.id]: currentYaw };
                    saveHeadings(updated);
                    return updated;
                  });
                  alert(`방향 저장 완료! (yaw: ${currentYaw}°)`);
                }}
                className="h-9 rounded-lg px-3 flex items-center gap-1.5 text-xs font-medium bg-amber-500/80 text-white hover:bg-amber-500 transition-colors"
              >
                방향 설정 ({Math.round(currentYaw)}°)
              </button>
            )}
            {/* Scene counter */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-mono">
              {currentIndex + 1} / {orderedScenes.length}
            </div>
            {/* Sidebar toggle (edit mode) */}
            {editMode && (
              <button
                type="button"
                onClick={() => setShowSidebar(!showSidebar)}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="text-white text-xs">{showSidebar ? "X" : `${totalHotspots}`}</span>
              </button>
            )}
            {/* Thumbnail toggle */}
            <button
              type="button"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <span className="text-white text-sm">{showThumbnails ? "\u2715" : "\u229E"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Panorama viewer */}
      <div className="flex-1 relative">
        <PanoramaViewer
          imageUrl={imageUrl}
          hotspots={hotspots}
          onHotspotClick={handleHotspotClick}
          onPanoramaClick={handlePanoramaClick}
          onViewChange={(yaw) => setCurrentYaw(yaw)}
          editMode={editMode}
          className="w-full h-full"
          initialYaw={headings[currentScene.id] ?? 0}
        />

        {/* Hotspot creation popup */}
        {pendingCoords && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-[#1c1f27] border border-white/20 rounded-2xl p-5 shadow-2xl w-80">
            <h3 className="text-white font-bold text-sm mb-4">핫스팟 추가</h3>

            <div className="space-y-3">
              {/* Coordinates display */}
              <div className="flex gap-2">
                <div className="flex-1 bg-[#111318] rounded-lg px-3 py-2">
                  <p className="text-[#9da6b9] text-[10px] mb-0.5">Yaw</p>
                  <p className="text-white text-sm font-mono">{pendingCoords.yaw}°</p>
                </div>
                <div className="flex-1 bg-[#111318] rounded-lg px-3 py-2">
                  <p className="text-[#9da6b9] text-[10px] mb-0.5">Pitch</p>
                  <p className="text-white text-sm font-mono">{pendingCoords.pitch}°</p>
                </div>
              </div>

              {/* Type selector */}
              <div>
                <p className="text-[#9da6b9] text-xs mb-1.5">유형</p>
                <div className="flex gap-1.5">
                  {([
                    { value: "valve" as const, label: "밸브", color: "emerald" },
                    { value: "info" as const, label: "정보", color: "blue" },
                    { value: "nav" as const, label: "이동", color: "gray" },
                  ]).map(({ value, label, color }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setHotspotType(value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        hotspotType === value
                          ? color === "emerald"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                            : color === "blue"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                              : "bg-white/20 text-white border border-white/50"
                          : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target scene selector (nav type only) */}
              {hotspotType === "nav" && (
                <div>
                  <p className="text-[#9da6b9] text-xs mb-1.5">이동할 장면</p>
                  <select
                    title="이동할 장면 선택"
                    value={navTargetId}
                    onChange={(e) => {
                      setNavTargetId(e.target.value);
                      const target = PANORAMA_SCENES.find((s) => s.id === e.target.value);
                      if (target && !hotspotLabel) setHotspotLabel(target.label);
                    }}
                    className="w-full bg-[#111318] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                  >
                    <option value="">장면을 선택하세요</option>
                    {PANORAMA_SCENES.filter((s) => s.id !== currentScene.id).map((scene, idx) => {
                      const d = getSceneDisplay(scene);
                      return (
                        <option key={scene.id} value={scene.id}>
                          #{idx + 1} {d.label} ({d.area})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Label input */}
              <div>
                <p className="text-[#9da6b9] text-xs mb-1.5">{hotspotType === "nav" ? "화살표 라벨" : "라벨 (밸브 태그 번호 등)"}</p>
                <input
                  type="text"
                  value={hotspotLabel}
                  onChange={(e) => setHotspotLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmHotspot(); if (e.key === "Escape") cancelHotspot(); }}
                  placeholder={hotspotType === "nav" ? "예: 오른쪽 문" : "예: VB-4302"}
                  autoFocus
                  className="w-full bg-[#111318] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelHotspot}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={confirmHotspot}
                  disabled={!hotspotLabel.trim()}
                  className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:text-white/30 text-white text-sm font-medium transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forward button */}
        <button
          type="button"
          disabled={currentIndex === orderedScenes.length - 1}
          onClick={() => setCurrentIndex((i) => Math.min(orderedScenes.length - 1, i + 1))}
          title="앞으로 이동"
          className="absolute bottom-[35%] left-1/2 -translate-x-1/2 z-20 group w-16 h-16 disabled:opacity-0 transition-all"
        >
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.6)" strokeWidth="2" className="group-hover:fill-[rgba(0,0,0,0.55)] group-hover:stroke-white transition-all" />
            <path d="M32 18 L44 34 L37 34 L37 46 L27 46 L27 34 L20 34 Z" fill="rgba(255,255,255,0.85)" className="group-hover:fill-white transition-colors" />
          </svg>
        </button>
        {/* Back button */}
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          title="뒤로 이동"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 group w-10 h-10 disabled:opacity-0 transition-all"
        >
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-lg">
            <circle cx="20" cy="20" r="18" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" className="group-hover:fill-[rgba(0,0,0,0.5)] transition-all" />
            <path d="M20 28 L13 18 L17.5 18 L17.5 12 L22.5 12 L22.5 18 L27 18 Z" fill="rgba(255,255,255,0.6)" className="group-hover:fill-white transition-colors" />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / orderedScenes.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Edit sidebar - hotspot list */}
      {editMode && showSidebar && (
        <div className="absolute top-14 right-0 bottom-0 w-72 z-30 bg-[#111318]/95 backdrop-blur-md border-l border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10">
            <h3 className="text-white text-sm font-bold mb-2">핫스팟 관리</h3>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={exportHotspots}
                className="flex-1 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
              >
                JSON 내보내기
              </button>
              <button
                type="button"
                onClick={importHotspots}
                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors"
              >
                JSON 불러오기
              </button>
            </div>
          </div>

          {/* Current scene info */}
          <div className="p-3 border-b border-white/10">
            <p className="text-[#9da6b9] text-xs mb-2">
              현재 장면: <span className="text-white">{currentScene.label}</span>
              <span className="text-white/40 ml-1">({currentScene.area})</span>
              <span className="text-primary ml-1">{currentSceneHotspots.length}개 핫스팟</span>
            </p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {currentSceneHotspots.length === 0 ? (
              <div className="p-4 text-center text-white/30 text-xs">
                파노라마를 클릭하여 핫스팟을 추가하세요
              </div>
            ) : (
              currentSceneHotspots.map((hs) => (
                <div
                  key={hs.id}
                  className="flex items-center justify-between px-3 py-2 border-b border-white/5 hover:bg-white/5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      hs.type === "valve" ? "bg-emerald-400" : hs.type === "info" ? "bg-blue-400" : "bg-white/40"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">{hs.label}</p>
                      <p className="text-white/30 text-[10px] font-mono">
                        {hs.yaw}°, {hs.pitch}°
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAllHotspots((prev) => {
                        const updated = { ...prev };
                        updated[currentScene.id] = (updated[currentScene.id] || []).filter((h) => h.id !== hs.id);
                        saveHotspots(updated);
                        return updated;
                      });
                    }}
                    className="text-red-400/60 hover:text-red-400 text-xs ml-2 flex-shrink-0 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>

          {/* All scenes summary */}
          <div className="p-3 border-t border-white/10">
            <p className="text-white/30 text-[10px]">
              전체: {totalHotspots}개 핫스팟 / {Object.keys(allHotspots).filter(k => (allHotspots[k]?.length || 0) > 0).length}개 장면
            </p>
          </div>
        </div>
      )}

      {/* Thumbnail strip */}
      {showThumbnails && (
        <div className="absolute bottom-16 left-0 right-0 z-30 bg-black/80 backdrop-blur-md border-t border-white/10">
          {editMode && (
            <div className="px-3 pt-2 pb-0 flex items-center gap-2">
              <span className="text-amber-400/80 text-[10px]">드래그하여 순서 변경</span>
              {sceneOrder && (
                <button
                  type="button"
                  onClick={() => {
                    setSceneOrder(null);
                    localStorage.removeItem(SCENE_ORDER_KEY);
                    setCurrentIndex(0);
                  }}
                  className="text-red-400/60 hover:text-red-400 text-[10px] underline"
                >
                  순서 초기화
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2 p-3 overflow-x-auto custom-scrollbar">
            {orderedScenes.map((scene, index) => {
              const sceneHs = allHotspots[scene.id] || [];
              const display = getSceneDisplay(scene);
              return (
                <button
                  type="button"
                  key={scene.id}
                  draggable={editMode}
                  onDragStart={(e) => {
                    if (!editMode) return;
                    setDragIdx(index);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    if (!editMode || dragIdx === null) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!editMode || dragIdx === null || dragIdx === index) {
                      setDragIdx(null);
                      return;
                    }
                    const newOrder = orderedScenes.map((s) => s.id);
                    const [moved] = newOrder.splice(dragIdx, 1);
                    newOrder.splice(index, 0, moved);
                    setSceneOrder(newOrder);
                    saveSceneOrder(newOrder);
                    // Keep viewing the same scene after reorder
                    const currentId = orderedScenes[currentIndex].id;
                    const newIdx = newOrder.indexOf(currentId);
                    if (newIdx >= 0) setCurrentIndex(newIdx);
                    setDragIdx(null);
                  }}
                  onDragEnd={() => setDragIdx(null)}
                  onClick={() => goTo(index)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    dragIdx === index
                      ? "border-amber-400 opacity-50"
                      : index === currentIndex
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-white/30"
                  } ${editMode ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <div className="w-24 h-14 bg-[#1c1f27] flex flex-col items-center justify-center relative">
                    <span className="text-[10px] text-white/60 text-center px-1">{display.label}</span>
                    {sceneHs.length > 0 && (
                      <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {sceneHs.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
