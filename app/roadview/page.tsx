"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Hotspot } from "@/components/PanoramaViewer";
import { PANORAMA_SCENES, DEFAULT_SCENE_ORDER } from "@/lib/roadviewScenes";

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

// JSON 파일에서 저장된 설정 로드 (public/data/roadview-settings.json)
async function fetchSavedSettings(): Promise<{
  hotspots?: Record<string, Hotspot[]>;
  headings?: Record<string, HeadingData>;
  sceneOverrides?: Record<string, SceneOverride>;
  sceneOrder?: string[];
} | null> {
  try {
    const res = await fetch("/data/roadview-settings.json", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

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

type HeadingData = { yaw: number; pitch: number; spherePitch?: number; sphereRoll?: number };

function loadSavedHeadings(): Record<string, HeadingData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HEADING_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Backward compatibility: convert old number format to {yaw, pitch}
    const result: Record<string, HeadingData> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number") {
        result[k] = { yaw: v, pitch: 0 };
      } else {
        result[k] = v as HeadingData;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function saveHeadings(data: Record<string, HeadingData>) {
  localStorage.setItem(HEADING_STORAGE_KEY, JSON.stringify(data));
}

type SceneOverride = { label?: string; area?: string; excludeFromPath?: boolean; hidden?: boolean };

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
  const [headings, setHeadings] = useState<Record<string, HeadingData>>({});
  const [currentYaw, setCurrentYaw] = useState(0);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [pendingCoords, setPendingCoords] = useState<{ yaw: number; pitch: number } | null>(null);
  const pendingCoordsRef = useRef<{ yaw: number; pitch: number } | null>(null);
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
  const [editingThumbnailId, setEditingThumbnailId] = useState<string | null>(null);
  const [thumbEditLabel, setThumbEditLabel] = useState("");
  const [thumbEditArea, setThumbEditArea] = useState("");
  // Multi-select for batch editing
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const lastClickedIdxRef = useRef<number | null>(null);
  const [batchLabel, setBatchLabel] = useState("");
  const [batchArea, setBatchArea] = useState("");
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const [navSearch, setNavSearch] = useState("");
  const [showLevelPanel, setShowLevelPanel] = useState(false);

  // Load settings on mount: JSON 파일(배포용) → localStorage(로컬 오버라이드) 순서로 병합
  useEffect(() => {
    async function load() {
      // 1. JSON 파일에서 저장된 설정 로드 (배포 시 기본값)
      const saved = await fetchSavedSettings();

      // 2. localStorage에서 로컬 오버라이드 로드
      const localHotspots = loadSavedHotspots();
      const localHeadings = loadSavedHeadings();
      const localOverrides = loadSceneOverrides();
      const localOrder = loadSceneOrder();

      // 3. 병합: JSON 파일 → localStorage 순서 (localStorage가 우선)
      setAllHotspots({ ...(saved?.hotspots || {}), ...localHotspots });
      setHeadings({ ...(saved?.headings || {}), ...localHeadings });
      setSceneOverrides({ ...(saved?.sceneOverrides || {}), ...localOverrides });
      setSceneOrder(localOrder ?? saved?.sceneOrder ?? DEFAULT_SCENE_ORDER);
    }
    load();
  }, []);

  // Build ordered scenes list from custom order (hidden scenes filtered out)
  const orderedScenes = useMemo(() => {
    let scenes: typeof PANORAMA_SCENES;
    if (!sceneOrder) {
      scenes = PANORAMA_SCENES;
    } else {
      const sceneMap = new Map(PANORAMA_SCENES.map((s) => [s.id, s]));
      const ordered = sceneOrder.map((id) => sceneMap.get(id)).filter(Boolean) as typeof PANORAMA_SCENES;
      // Append any new scenes not in the saved order
      const orderedIds = new Set(sceneOrder);
      for (const s of PANORAMA_SCENES) {
        if (!orderedIds.has(s.id)) ordered.push(s);
      }
      scenes = ordered;
    }
    return scenes.filter((s) => !sceneOverrides[s.id]?.hidden);
  }, [sceneOrder, sceneOverrides]);

  // Main path: indices of scenes not excluded from arrow navigation
  const mainPathIndices = useMemo(() => {
    return orderedScenes
      .map((_, i) => i)
      .filter((i) => !sceneOverrides[orderedScenes[i].id]?.excludeFromPath);
  }, [orderedScenes, sceneOverrides]);

  const isOnMainPath = mainPathIndices.includes(currentIndex);
  const mainPathPosition = isOnMainPath ? mainPathIndices.indexOf(currentIndex) : -1;

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
    if (hs.type === "nav" && hs.targetSceneId) {
      const targetIdx = orderedScenes.findIndex((s) => s.id === hs.targetSceneId);
      if (targetIdx >= 0) setCurrentIndex(targetIdx);
    }
  }, [orderedScenes]);

  const handleHotspotDelete = useCallback((hs: Hotspot) => {
    if (confirm(`"${hs.label}" 핫스팟을 삭제하시겠습니까?`)) {
      setAllHotspots((prev) => {
        const updated = { ...prev };
        updated[currentScene.id] = (updated[currentScene.id] || []).filter((h) => h.id !== hs.id);
        saveHotspots(updated);
        return updated;
      });
    }
  }, [currentScene.id]);

  // Handle panorama click in edit mode (ref로 좌표 잠금 — 팝업 열려있으면 무시)
  const handlePanoramaClick = useCallback((coords: { yaw: number; pitch: number }) => {
    if (pendingCoordsRef.current) return; // 팝업 열려있으면 새 좌표 무시
    pendingCoordsRef.current = coords;
    setPendingCoords(coords);
    setHotspotLabel("");
  }, []);

  // Confirm and add hotspot (ref에서 좌표 읽기 — 입력 중 좌표 변조 방지)
  const confirmHotspot = useCallback(() => {
    const coords = pendingCoordsRef.current;
    if (!coords || !hotspotLabel.trim()) return;
    if (hotspotType === "nav" && !navTargetId) return;

    const newHotspot: Hotspot = {
      id: `hs_${Date.now()}`,
      label: hotspotLabel.trim(),
      yaw: coords.yaw,
      pitch: coords.pitch,
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

    pendingCoordsRef.current = null;
    setPendingCoords(null);
    setHotspotLabel("");
    setNavTargetId("");
  }, [hotspotLabel, hotspotType, navTargetId, currentScene.id]);

  const cancelHotspot = useCallback(() => {
    pendingCoordsRef.current = null;
    setPendingCoords(null);
    setHotspotLabel("");
  }, []);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setShowThumbnails(false);
    setEditingScene(false);
  };

  // Navigate to next/previous scene on main path only (arrows skip branch scenes)
  const goNextMain = useCallback(() => {
    const next = mainPathIndices.find((i) => i > currentIndex);
    if (next !== undefined) setCurrentIndex(next);
  }, [currentIndex, mainPathIndices]);

  const goPrevMain = useCallback(() => {
    const prev = [...mainPathIndices].reverse().find((i) => i < currentIndex);
    if (prev !== undefined) setCurrentIndex(prev);
  }, [currentIndex, mainPathIndices]);

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

  // 설정을 JSON 파일로 서버에 저장 (public/data/roadview-settings.json)
  const [saving, setSaving] = useState(false);
  const saveSettings = useCallback(async () => {
    setSaving(true);
    try {
      const data = {
        hotspots: allHotspots,
        headings,
        sceneOverrides,
        sceneOrder: orderedScenes.map((s) => s.id),
      };
      const res = await fetch("/api/roadview-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        alert("설정이 저장되었습니다!\n커밋 후 배포하면 동일하게 적용됩니다.");
      } else {
        alert(`저장 실패: ${result.error || "알 수 없는 오류"}`);
      }
    } catch (e) {
      alert(`저장 실패: ${e instanceof Error ? e.message : "네트워크 오류"}`);
    } finally {
      setSaving(false);
    }
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

  // Auto-scroll thumbnail strip to current scene
  useEffect(() => {
    if (!showThumbnails || !thumbStripRef.current) return;
    const container = thumbStripRef.current;
    const card = container.children[currentIndex] as HTMLElement | undefined;
    if (!card) return;
    // 약간의 딜레이로 DOM 렌더링 후 스크롤
    requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  }, [currentIndex, showThumbnails]);

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

  // Keyboard navigation — arrows follow main path only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pendingCoords || editingScene) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNextMain();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrevMain();
      } else if (e.key === "e" || e.key === "E") {
        setEditMode((m) => !m);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingCoords, editingScene, goNextMain, goPrevMain]);

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
              onClick={() => { setEditMode(!editMode); pendingCoordsRef.current = null; setPendingCoords(null); }}
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
                    const updated = { ...prev, [currentScene.id]: { yaw: currentYaw, pitch: currentPitch } };
                    saveHeadings(updated);
                    return updated;
                  });
                  alert(`방향 저장 완료! (yaw: ${Math.round(currentYaw)}°, pitch: ${Math.round(currentPitch)}°)`);
                }}
                className="h-9 rounded-lg px-3 flex items-center gap-1.5 text-xs font-medium bg-amber-500/80 text-white hover:bg-amber-500 transition-colors"
              >
                방향 설정 ({Math.round(currentYaw)}°, {Math.round(currentPitch)}°)
              </button>
            )}
            {/* Level correction toggle (edit mode only) */}
            {editMode && (
              <button
                type="button"
                onClick={() => setShowLevelPanel(!showLevelPanel)}
                className={`h-9 rounded-lg px-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  showLevelPanel
                    ? "bg-blue-500/80 text-white hover:bg-blue-500"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
              >
                수평 보정
              </button>
            )}
            {/* Main/branch toggle (edit mode only) */}
            {editMode && (
              <button
                type="button"
                onClick={() => {
                  setSceneOverrides((prev) => {
                    const current = prev[baseScene.id] || {};
                    const updated = { ...prev, [baseScene.id]: { ...current, excludeFromPath: !current.excludeFromPath } };
                    saveSceneOverrides(updated);
                    return updated;
                  });
                }}
                className={`h-9 rounded-lg px-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  sceneOverrides[baseScene.id]?.excludeFromPath
                    ? "bg-orange-500/80 text-white hover:bg-orange-500"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {sceneOverrides[baseScene.id]?.excludeFromPath ? "분기 씬" : "메인 경로"}
              </button>
            )}
            {/* Scene counter */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-mono">
              {isOnMainPath
                ? `${mainPathPosition + 1} / ${mainPathIndices.length}`
                : `분기 (${currentIndex + 1}/${orderedScenes.length})`}
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
          onHotspotDelete={handleHotspotDelete}
          onPanoramaClick={handlePanoramaClick}
          onViewChange={(yaw, pitch) => { setCurrentYaw(yaw); setCurrentPitch(pitch); }}
          editMode={editMode}
          className="w-full h-full"
          initialYaw={headings[currentScene.id]?.yaw ?? 0}
          initialPitch={headings[currentScene.id]?.pitch ?? 0}
          sphereCorrection={{
            pitch: headings[currentScene.id]?.spherePitch ?? 0,
            roll: headings[currentScene.id]?.sphereRoll ?? 0,
          }}
        />

        {/* Hotspot creation popup */}
        {pendingCoords && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-[#1c1f27] border border-white/20 rounded-2xl p-5 shadow-2xl w-80"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
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
                  {navTargetId ? (
                    <div className="flex items-center gap-2 bg-[#111318] border border-primary/50 rounded-lg px-3 py-2">
                      <span className="text-white text-sm flex-1 truncate">
                        #{orderedScenes.findIndex((s) => s.id === navTargetId) + 1} {getSceneDisplay(orderedScenes.find((s) => s.id === navTargetId)!).label}
                      </span>
                      <button type="button" onClick={() => { setNavTargetId(""); setNavSearch(""); }} className="text-white/40 hover:text-white text-xs">X</button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="번호 또는 이름 검색..."
                        value={navSearch}
                        onChange={(e) => setNavSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="w-full bg-[#111318] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/50 mb-1"
                      />
                      <div className="max-h-40 overflow-y-auto bg-[#111318] border border-white/10 rounded-lg">
                        {orderedScenes
                          .filter((s) => s.id !== currentScene.id)
                          .filter((s) => {
                            if (!navSearch.trim()) return true;
                            const q = navSearch.trim().toLowerCase();
                            const d = getSceneDisplay(s);
                            const idx = orderedScenes.indexOf(s) + 1;
                            return d.label.toLowerCase().includes(q) || d.area.toLowerCase().includes(q) || String(idx).includes(q) || s.id.includes(q);
                          })
                          .map((scene) => {
                            const d = getSceneDisplay(scene);
                            const idx = orderedScenes.indexOf(scene) + 1;
                            return (
                              <button
                                key={scene.id}
                                type="button"
                                onClick={() => {
                                  setNavTargetId(scene.id);
                                  if (!hotspotLabel) setHotspotLabel(d.label);
                                  setNavSearch("");
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs transition-colors flex items-center gap-2"
                              >
                                <span className="text-primary font-mono w-8 text-right flex-shrink-0">#{idx}</span>
                                <span className="text-white truncate">{d.label}</span>
                                <span className="text-white/30 flex-shrink-0">({d.area})</span>
                              </button>
                            );
                          })}
                      </div>
                    </>
                  )}
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

        {/* Level correction panel */}
        {editMode && showLevelPanel && (
          <div
            className="absolute top-16 left-4 z-40 bg-[#1c1f27]/95 border border-white/20 rounded-xl p-4 shadow-2xl w-72 backdrop-blur-md"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">수평 보정</h3>
              <button
                type="button"
                onClick={() => {
                  setHeadings((prev) => {
                    const updated = { ...prev, [currentScene.id]: { ...prev[currentScene.id], yaw: prev[currentScene.id]?.yaw ?? 0, pitch: prev[currentScene.id]?.pitch ?? 0, spherePitch: 0, sphereRoll: 0 } };
                    saveHeadings(updated);
                    return updated;
                  });
                }}
                className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
              >
                초기화
              </button>
            </div>

            {/* Pitch (앞뒤 기울기) */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#9da6b9] text-xs">피치 (앞뒤)</span>
                <span className="text-white text-xs font-mono">{(headings[currentScene.id]?.spherePitch ?? 0).toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                step={0.5}
                value={headings[currentScene.id]?.spherePitch ?? 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setHeadings((prev) => {
                    const updated = { ...prev, [currentScene.id]: { ...prev[currentScene.id], yaw: prev[currentScene.id]?.yaw ?? 0, pitch: prev[currentScene.id]?.pitch ?? 0, spherePitch: val } };
                    saveHeadings(updated);
                    return updated;
                  });
                }}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Roll (좌우 기울기) */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#9da6b9] text-xs">롤 (좌우)</span>
                <span className="text-white text-xs font-mono">{(headings[currentScene.id]?.sphereRoll ?? 0).toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                step={0.5}
                value={headings[currentScene.id]?.sphereRoll ?? 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setHeadings((prev) => {
                    const updated = { ...prev, [currentScene.id]: { ...prev[currentScene.id], yaw: prev[currentScene.id]?.yaw ?? 0, pitch: prev[currentScene.id]?.pitch ?? 0, sphereRoll: val } };
                    saveHeadings(updated);
                    return updated;
                  });
                }}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Fine-tune buttons */}
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-white/30 text-[10px] mb-1 text-center">피치 미세조정</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => { setHeadings((prev) => { const cur = prev[currentScene.id]; const updated = { ...prev, [currentScene.id]: { ...cur, yaw: cur?.yaw ?? 0, pitch: cur?.pitch ?? 0, spherePitch: Math.max(-30, (cur?.spherePitch ?? 0) - 0.5) } }; saveHeadings(updated); return updated; }); }} className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-colors">-0.5</button>
                  <button type="button" onClick={() => { setHeadings((prev) => { const cur = prev[currentScene.id]; const updated = { ...prev, [currentScene.id]: { ...cur, yaw: cur?.yaw ?? 0, pitch: cur?.pitch ?? 0, spherePitch: Math.min(30, (cur?.spherePitch ?? 0) + 0.5) } }; saveHeadings(updated); return updated; }); }} className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-colors">+0.5</button>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-white/30 text-[10px] mb-1 text-center">롤 미세조정</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => { setHeadings((prev) => { const cur = prev[currentScene.id]; const updated = { ...prev, [currentScene.id]: { ...cur, yaw: cur?.yaw ?? 0, pitch: cur?.pitch ?? 0, sphereRoll: Math.max(-30, (cur?.sphereRoll ?? 0) - 0.5) } }; saveHeadings(updated); return updated; }); }} className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-colors">-0.5</button>
                  <button type="button" onClick={() => { setHeadings((prev) => { const cur = prev[currentScene.id]; const updated = { ...prev, [currentScene.id]: { ...cur, yaw: cur?.yaw ?? 0, pitch: cur?.pitch ?? 0, sphereRoll: Math.min(30, (cur?.sphereRoll ?? 0) + 0.5) } }; saveHeadings(updated); return updated; }); }} className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-colors">+0.5</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branch scene indicator */}
        {!isOnMainPath && !editMode && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-orange-500/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs font-medium pointer-events-none">
            분기 씬 — 핫스팟으로 돌아가기
          </div>
        )}

        {/* Forward button — main path only */}
        <button
          type="button"
          disabled={!mainPathIndices.some((i) => i > currentIndex)}
          onClick={goNextMain}
          title="앞으로 이동 (메인 경로)"
          className="absolute bottom-[35%] left-1/2 -translate-x-1/2 z-20 group w-16 h-16 disabled:opacity-0 transition-all"
        >
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.6)" strokeWidth="2" className="group-hover:fill-[rgba(0,0,0,0.55)] group-hover:stroke-white transition-all" />
            <path d="M32 18 L44 34 L37 34 L37 46 L27 46 L27 34 L20 34 Z" fill="rgba(255,255,255,0.85)" className="group-hover:fill-white transition-colors" />
          </svg>
        </button>
        {/* Back button — main path only */}
        <button
          type="button"
          disabled={!mainPathIndices.some((i) => i < currentIndex)}
          onClick={goPrevMain}
          title="뒤로 이동 (메인 경로)"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 group w-10 h-10 disabled:opacity-0 transition-all"
        >
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-lg">
            <circle cx="20" cy="20" r="18" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" className="group-hover:fill-[rgba(0,0,0,0.5)] transition-all" />
            <path d="M20 28 L13 18 L17.5 18 L17.5 12 L22.5 12 L22.5 18 L27 18 Z" fill="rgba(255,255,255,0.6)" className="group-hover:fill-white transition-colors" />
          </svg>
        </button>

        {/* Progress bar — based on main path */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <div
            className={`h-full transition-all duration-300 ${isOnMainPath ? "bg-primary" : "bg-orange-500"}`}
            style={{ width: `${isOnMainPath && mainPathIndices.length > 0 ? ((mainPathPosition + 1) / mainPathIndices.length) * 100 : 0}%` }}
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
                onClick={saveSettings}
                disabled={saving}
                className="flex-[2] py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-400 text-xs font-bold transition-colors"
              >
                {saving ? "저장 중..." : "설정 저장"}
              </button>
              <button
                type="button"
                onClick={exportHotspots}
                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-xs font-medium transition-colors"
              >
                JSON
              </button>
              <button
                type="button"
                onClick={importHotspots}
                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-xs font-medium transition-colors"
              >
                불러오기
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

          {/* Hidden scenes recovery */}
          {(() => {
            const hiddenScenes = PANORAMA_SCENES.filter((s) => sceneOverrides[s.id]?.hidden);
            if (hiddenScenes.length === 0) return null;
            return (
              <div className="p-3 border-t border-white/10">
                <p className="text-white/40 text-[10px] mb-1">숨긴 장면 ({hiddenScenes.length})</p>
                <div className="max-h-24 overflow-y-auto space-y-0.5">
                  {hiddenScenes.map((s) => {
                    const ov = sceneOverrides[s.id];
                    return (
                      <div key={s.id} className="flex items-center justify-between text-[10px]">
                        <span className="text-white/30 truncate">{ov?.label || s.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSceneOverrides((prev) => {
                              const updated = { ...prev, [s.id]: { ...prev[s.id], hidden: undefined } };
                              saveSceneOverrides(updated);
                              return updated;
                            });
                          }}
                          className="text-emerald-400/60 hover:text-emerald-400 ml-2 flex-shrink-0"
                        >
                          복구
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
              <span className="text-amber-400/80 text-[10px]">{selectedSceneIds.size > 0 ? "SHIFT+클릭으로 범위 추가" : "SHIFT+클릭으로 다중 선택 / 드래그로 순서 변경"}</span>
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
          {/* Batch edit bar for multi-select */}
          {editMode && selectedSceneIds.size > 0 && (
            <div className="mx-3 mt-2 mb-0 bg-cyan-900/60 border border-cyan-400/30 rounded-lg px-3 py-2 flex items-center gap-3">
              <span className="text-cyan-300 text-xs font-bold flex-shrink-0">
                {selectedSceneIds.size}개 선택
              </span>
              <input
                type="text"
                placeholder="이름 접두사 (예: B1 복도)"
                value={batchLabel}
                onChange={(e) => setBatchLabel(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="bg-white/10 border border-cyan-400/40 rounded px-2 py-1 text-white text-xs w-40 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                placeholder="구역 (예: B1)"
                value={batchArea}
                onChange={(e) => setBatchArea(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="bg-white/10 border border-cyan-400/40 rounded px-2 py-1 text-amber-300 text-xs w-28 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                disabled={!batchLabel.trim() && !batchArea.trim()}
                onClick={() => {
                  setSceneOverrides((prev) => {
                    const updated = { ...prev };
                    let counter = 1;
                    for (const s of orderedScenes) {
                      if (!selectedSceneIds.has(s.id)) continue;
                      const existing = updated[s.id] || {};
                      updated[s.id] = {
                        ...existing,
                        ...(batchLabel.trim() ? { label: `${batchLabel.trim()} ${counter}` } : {}),
                        ...(batchArea.trim() ? { area: batchArea.trim() } : {}),
                      };
                      counter++;
                    }
                    saveSceneOverrides(updated);
                    return updated;
                  });
                  setSelectedSceneIds(new Set());
                  lastClickedIdxRef.current = null;
                  setBatchLabel("");
                  setBatchArea("");
                }}
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30 text-white text-xs font-bold transition-colors"
              >
                일괄 적용
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSceneIds(new Set());
                  lastClickedIdxRef.current = null;
                  setBatchLabel("");
                  setBatchArea("");
                }}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/60 text-xs transition-colors"
              >
                취소
              </button>
            </div>
          )}
          <div ref={thumbStripRef} className="flex gap-2 p-3 overflow-x-auto custom-scrollbar">
            {orderedScenes.map((scene, index) => {
              const sceneHs = allHotspots[scene.id] || [];
              const display = getSceneDisplay(scene);
              const isBranch = sceneOverrides[scene.id]?.excludeFromPath;
              return (
                <div
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
                    const currentId = orderedScenes[currentIndex].id;
                    const newIdx = newOrder.indexOf(currentId);
                    if (newIdx >= 0) setCurrentIndex(newIdx);
                    setDragIdx(null);
                  }}
                  onDragEnd={() => setDragIdx(null)}
                  onClick={(e) => {
                    if (editMode && e.shiftKey) {
                      e.stopPropagation();
                      setSelectedSceneIds((prev) => {
                        const next = new Set(prev);
                        if (lastClickedIdxRef.current !== null) {
                          const from = Math.min(lastClickedIdxRef.current, index);
                          const to = Math.max(lastClickedIdxRef.current, index);
                          for (let i = from; i <= to; i++) {
                            next.add(orderedScenes[i].id);
                          }
                        } else {
                          next.add(scene.id);
                        }
                        lastClickedIdxRef.current = index;
                        return next;
                      });
                      return;
                    }
                    // 일반 클릭: 선택 초기화 후 이동
                    if (selectedSceneIds.size > 0) {
                      setSelectedSceneIds(new Set());
                      lastClickedIdxRef.current = null;
                    }
                    goTo(index);
                  }}
                  className={`group/thumb flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedSceneIds.has(scene.id)
                      ? "border-cyan-400 ring-2 ring-cyan-400/40 bg-cyan-500/10"
                      : dragIdx === index
                        ? "border-amber-400 opacity-50"
                        : index === currentIndex
                          ? "border-primary ring-2 ring-primary/30"
                          : isBranch
                            ? "border-orange-500/40 opacity-60 hover:opacity-80"
                            : "border-transparent hover:border-white/30"
                  } ${editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                >
                  <div className="w-32 h-[4.5rem] bg-[#1c1f27] flex flex-col items-center justify-center gap-0.5 relative">
                    {editMode && editingThumbnailId === scene.id ? (
                      <div className="flex flex-col gap-0.5 items-center" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          title="씬 이름"
                          value={thumbEditLabel}
                          onChange={(e) => setThumbEditLabel(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                              const saveThumb = () => {
                                setSceneOverrides((prev) => {
                                  const updated = {
                                    ...prev,
                                    [scene.id]: {
                                      ...prev[scene.id],
                                      ...(thumbEditLabel.trim() ? { label: thumbEditLabel.trim() } : {}),
                                      ...(thumbEditArea.trim() ? { area: thumbEditArea.trim() } : {}),
                                    },
                                  };
                                  saveSceneOverrides(updated);
                                  return updated;
                                });
                              };
                              if (thumbEditLabel.trim() || thumbEditArea.trim()) saveThumb();
                              setEditingThumbnailId(null);
                            }
                            if (e.key === "Escape") setEditingThumbnailId(null);
                          }}
                          onBlur={() => {
                            // blur는 area 입력으로 포커스 이동 시 무시 (setTimeout으로 체크)
                            setTimeout(() => {
                              if (editingThumbnailId !== scene.id) return;
                              const active = document.activeElement as HTMLElement;
                              if (active?.dataset?.thumbArea === scene.id) return;
                              if (thumbEditLabel.trim() || thumbEditArea.trim()) {
                                setSceneOverrides((prev) => {
                                  const updated = {
                                    ...prev,
                                    [scene.id]: {
                                      ...prev[scene.id],
                                      ...(thumbEditLabel.trim() ? { label: thumbEditLabel.trim() } : {}),
                                      ...(thumbEditArea.trim() ? { area: thumbEditArea.trim() } : {}),
                                    },
                                  };
                                  saveSceneOverrides(updated);
                                  return updated;
                                });
                              }
                              setEditingThumbnailId(null);
                            }, 100);
                          }}
                          autoFocus
                          className="w-28 bg-white/10 border border-primary/50 rounded px-1.5 py-0.5 text-white text-xs text-center focus:outline-none"
                        />
                        <input
                          type="text"
                          title="구역"
                          placeholder="구역"
                          data-thumb-area={scene.id}
                          value={thumbEditArea}
                          onChange={(e) => setThumbEditArea(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                              if (thumbEditLabel.trim() || thumbEditArea.trim()) {
                                setSceneOverrides((prev) => {
                                  const updated = {
                                    ...prev,
                                    [scene.id]: {
                                      ...prev[scene.id],
                                      ...(thumbEditLabel.trim() ? { label: thumbEditLabel.trim() } : {}),
                                      ...(thumbEditArea.trim() ? { area: thumbEditArea.trim() } : {}),
                                    },
                                  };
                                  saveSceneOverrides(updated);
                                  return updated;
                                });
                              }
                              setEditingThumbnailId(null);
                            }
                            if (e.key === "Escape") setEditingThumbnailId(null);
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              if (editingThumbnailId !== scene.id) return;
                              const active = document.activeElement as HTMLElement;
                              if (active?.closest(`[data-thumb-area="${scene.id}"]`)) return;
                              if (thumbEditLabel.trim() || thumbEditArea.trim()) {
                                setSceneOverrides((prev) => {
                                  const updated = {
                                    ...prev,
                                    [scene.id]: {
                                      ...prev[scene.id],
                                      ...(thumbEditLabel.trim() ? { label: thumbEditLabel.trim() } : {}),
                                      ...(thumbEditArea.trim() ? { area: thumbEditArea.trim() } : {}),
                                    },
                                  };
                                  saveSceneOverrides(updated);
                                  return updated;
                                });
                              }
                              setEditingThumbnailId(null);
                            }, 100);
                          }}
                          className="w-28 bg-white/10 border border-amber-500/50 rounded px-1.5 py-0.5 text-amber-300 text-[11px] text-center focus:outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <span className={`text-xs text-center px-1 leading-tight font-medium ${isBranch ? "text-orange-400/70" : "text-white/70"}`}>
                          {display.label}
                        </span>
                        <span className="text-[10px] text-amber-400/60 leading-tight">
                          {display.area}
                        </span>
                      </>
                    )}
                    {editMode && editingThumbnailId !== scene.id && (
                      <>
                        <button
                          type="button"
                          title="이름/구역 변경"
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded bg-white/20 hover:bg-primary/80 text-white/60 hover:text-white text-[8px] flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            const isDefault = display.label.startsWith("촬영 ");
                            if (isDefault && index > 0) {
                              const prevDisplay = getSceneDisplay(orderedScenes[index - 1]);
                              const spaceIdx = prevDisplay.label.indexOf(" ");
                              const prefix = spaceIdx > 0 ? prevDisplay.label.slice(0, spaceIdx + 1) : "";
                              setThumbEditLabel(prefix);
                              setThumbEditArea(prevDisplay.area);
                            } else {
                              setThumbEditLabel(display.label);
                              setThumbEditArea(display.area);
                            }
                            setEditingThumbnailId(scene.id);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          title="카드 삭제"
                          className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded bg-red-500/60 hover:bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!confirm(`"${display.label}" 카드를 삭제하시겠습니까?`)) return;
                            setSceneOverrides((prev) => {
                              const updated = { ...prev, [scene.id]: { ...prev[scene.id], hidden: true } };
                              saveSceneOverrides(updated);
                              return updated;
                            });
                            if (index === currentIndex) {
                              setCurrentIndex(Math.min(index, orderedScenes.length - 2));
                            } else if (index < currentIndex) {
                              setCurrentIndex(currentIndex - 1);
                            }
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          ✕
                        </button>
                      </>
                    )}
                    {selectedSceneIds.has(scene.id) && (
                      <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] flex items-center justify-center font-bold z-10">✓</span>
                    )}
                    {isBranch && !selectedSceneIds.has(scene.id) && (
                      <span className="absolute top-0.5 left-0.5 text-orange-400 text-[8px] font-bold">분기</span>
                    )}
                    {sceneHs.length > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-emerald-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {sceneHs.length}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
