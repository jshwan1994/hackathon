"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";

interface PanoramaViewerProps {
  imageUrl: string;
  hotspots?: Hotspot[];
  onHotspotClick?: (hotspot: Hotspot) => void;
  onHotspotDelete?: (hotspot: Hotspot) => void;
  onPanoramaClick?: (coords: { yaw: number; pitch: number }) => void;
  onViewChange?: (yaw: number, pitch: number) => void;
  editMode?: boolean;
  className?: string;
  initialYaw?: number;
  initialPitch?: number;
  sphereCorrection?: { pitch: number; roll: number };
}

export interface Hotspot {
  id: string;
  label: string;
  yaw: number;   // degrees, horizontal angle
  pitch: number;  // degrees, vertical angle
  type?: "valve" | "nav" | "info";
  sceneId?: string; // which scene this hotspot belongs to
  targetSceneId?: string; // for nav type: which scene to navigate to
}

export default function PanoramaViewer({
  imageUrl,
  hotspots = [],
  onHotspotClick,
  onHotspotDelete,
  onPanoramaClick,
  onViewChange,
  editMode = false,
  className = "",
  initialYaw = 0,
  initialPitch = 0,
  sphereCorrection,
}: PanoramaViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const dragDistRef = useRef(0);
  const rotationRef = useRef({ lon: initialYaw, lat: initialPitch });
  const initialYawRef = useRef(initialYaw);
  const initialPitchRef = useRef(initialPitch);
  const fovRef = useRef(75);
  const rafRef = useRef(0);
  const sphereCorrectionRef = useRef(sphereCorrection);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ color: 0x111318 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const { lon, lat } = rotationRef.current;
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      const target = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );
      camera.lookAt(target);
      camera.fov = fovRef.current;
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Keep refs in sync so texture-load callback reads latest values
  useEffect(() => {
    initialYawRef.current = initialYaw;
    initialPitchRef.current = initialPitch;
  }, [initialYaw, initialPitch]);

  // Keep sphere correction ref in sync (applied in texture load callback + slider interaction)
  useEffect(() => {
    sphereCorrectionRef.current = sphereCorrection;
    // Only apply live updates when NOT loading (slider interaction on current scene)
    if (!loading && meshRef.current) {
      meshRef.current.rotation.x = THREE.MathUtils.degToRad(sphereCorrection?.pitch ?? 0);
      meshRef.current.rotation.z = THREE.MathUtils.degToRad(sphereCorrection?.roll ?? 0);
    }
  }, [sphereCorrection?.pitch, sphereCorrection?.roll, loading]);

  // Load texture when imageUrl changes — reset camera AFTER texture loads
  // NOTE: Only depends on imageUrl so that setting heading doesn't re-trigger texture load
  useEffect(() => {
    setLoading(true);

    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (meshRef.current) {
          const oldMaterial = meshRef.current.material as THREE.MeshBasicMaterial;
          oldMaterial.map = texture;
          oldMaterial.color.set(0xffffff);
          oldMaterial.needsUpdate = true;

          // Apply sphere correction atomically with new texture
          const corr = sphereCorrectionRef.current;
          meshRef.current.rotation.x = THREE.MathUtils.degToRad(corr?.pitch ?? 0);
          meshRef.current.rotation.z = THREE.MathUtils.degToRad(corr?.roll ?? 0);
        }
        // Set rotation only after new texture is applied — no jarring twist
        rotationRef.current = { lon: initialYawRef.current, lat: initialPitchRef.current };
        setLoading(false);
      },
      undefined,
      () => setLoading(false)
    );
  }, [imageUrl]);

  // Convert screen click to yaw/pitch (컨테이너 rect 기준)
  const screenToYawPitch = useCallback((clientX: number, clientY: number) => {
    const camera = cameraRef.current;
    const container = mountRef.current;
    if (!camera || !container) return null;

    const rect = container.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    const dir = raycaster.ray.direction;
    const yaw = THREE.MathUtils.radToDeg(Math.atan2(dir.z, dir.x));
    const pitch = THREE.MathUtils.radToDeg(Math.asin(dir.y));

    return { yaw: Math.round(yaw * 10) / 10, pitch: Math.round(pitch * 10) / 10 };
  }, []);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    dragDistRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    dragDistRef.current += Math.abs(dx) + Math.abs(dy);

    rotationRef.current.lon -= dx * 0.2;
    rotationRef.current.lat = Math.max(-85, Math.min(85, rotationRef.current.lat + dy * 0.2));
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const wasDrag = dragDistRef.current > 5;
    setIsDragging(false);

    // In edit mode, treat short clicks (not drags) as placement clicks
    if (editMode && !wasDrag && onPanoramaClick) {
      const coords = screenToYawPitch(e.clientX, e.clientY);
      if (coords) onPanoramaClick(coords);
    }

    // Report current view direction to parent
    if (onViewChange) {
      onViewChange(
        Math.round(rotationRef.current.lon * 10) / 10,
        Math.round(rotationRef.current.lat * 10) / 10
      );
    }
  }, [editMode, onPanoramaClick, screenToYawPitch, onViewChange]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    fovRef.current = Math.max(30, Math.min(120, fovRef.current + e.deltaY * 0.05));
  }, []);

  // Compute hotspot 2D screen position
  const getHotspotScreenPos = useCallback((hs: Hotspot) => {
    const camera = cameraRef.current;
    const container = mountRef.current;
    if (!camera || !container) return null;

    const phi = THREE.MathUtils.degToRad(90 - hs.pitch);
    const theta = THREE.MathUtils.degToRad(hs.yaw);

    const worldPos = new THREE.Vector3(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    );

    const projected = worldPos.project(camera);
    if (projected.z > 1) return null;

    const rect = container.getBoundingClientRect();
    const x = (projected.x + 1) / 2 * rect.width;
    const y = (-projected.y + 1) / 2 * rect.height;

    if (x < -20 || x > rect.width + 20 || y < -20 || y > rect.height + 20) return null;

    return { x, y };
  }, []);

  // Get edge indicator position for off-screen hotspots
  const getHotspotEdgePos = useCallback((hs: Hotspot) => {
    const camera = cameraRef.current;
    const container = mountRef.current;
    if (!camera || !container) return null;

    const phi = THREE.MathUtils.degToRad(90 - hs.pitch);
    const theta = THREE.MathUtils.degToRad(hs.yaw);

    const worldPos = new THREE.Vector3(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    );

    const projected = worldPos.clone().project(camera);

    const rect = container.getBoundingClientRect();
    let x = (projected.x + 1) / 2 * rect.width;
    let y = (-projected.y + 1) / 2 * rect.height;

    // Check if already on screen
    const margin = 20;
    const isOnScreen = projected.z <= 1 &&
      x >= -margin && x <= rect.width + margin &&
      y >= -margin && y <= rect.height + margin;

    if (isOnScreen) return null;

    // If behind camera, flip direction
    if (projected.z > 1) {
      x = rect.width - x;
      y = rect.height - y;
    }

    // Clamp to viewport edge
    const pad = 36;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const dx = x - cx;
    const dy = y - cy;
    const angle = Math.atan2(dy, dx);

    const maxX = rect.width / 2 - pad;
    const maxY = rect.height / 2 - pad;

    const scaleX = Math.abs(dx) > 0.001 ? maxX / Math.abs(dx) : 1000;
    const scaleY = Math.abs(dy) > 0.001 ? maxY / Math.abs(dy) : 1000;
    const scale = Math.min(scaleX, scaleY, 1);

    const edgeX = cx + dx * scale;
    const edgeY = cy + dy * scale;

    return { x: edgeX, y: edgeY, angle: angle * 180 / Math.PI };
  }, []);

  // Smooth rotate camera to face a hotspot
  const rotateToHotspot = useCallback((hs: Hotspot) => {
    const startLon = rotationRef.current.lon;
    const startLat = rotationRef.current.lat;
    const targetLon = hs.yaw;
    const targetLat = hs.pitch;

    // Shortest path for longitude
    let dLon = targetLon - startLon;
    while (dLon > 180) dLon -= 360;
    while (dLon < -180) dLon += 360;

    const startTime = performance.now();
    const duration = 400;

    const animateRotation = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      rotationRef.current.lon = startLon + dLon * ease;
      rotationRef.current.lat = startLat + (targetLat - startLat) * ease;
      if (t < 1) requestAnimationFrame(animateRotation);
    };
    requestAnimationFrame(animateRotation);
  }, []);

  // Hotspot positions update
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 50);
    return () => clearInterval(interval);
  }, []);

  const cursorStyle = editMode
    ? isDragging ? "grabbing" : "crosshair"
    : isDragging ? "grabbing" : "grab";

  return (
    <div className={`relative overflow-hidden select-none ${className}`} style={{ cursor: cursorStyle }}>
      <div
        ref={mountRef}
        className="w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111318]/80 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[#9da6b9] text-sm">360° 파노라마 로딩 중...</p>
          </div>
        </div>
      )}

      {/* Edit mode crosshair indicator */}
      {editMode && !loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-red-500/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-bold pointer-events-none">
          편집 모드 — 클릭하여 핫스팟 배치
        </div>
      )}

      {/* Hotspots overlay */}
      {!loading && hotspots.map((hs) => {
        const pos = getHotspotScreenPos(hs);
        if (!pos) return null;

        // Nav type: floor circle marker (Street View style)
        if (hs.type === "nav") {
          return (
            <div
              key={hs.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group"
              style={{ left: pos.x, top: pos.y, pointerEvents: "auto" }}
            >
              <button
                type="button"
                title={hs.label}
                className="relative"
                onClick={(e) => { e.stopPropagation(); onHotspotClick?.(hs); }}
              >
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                {/* Outer ring */}
                <span className="relative block w-8 h-8 rounded-full border-2 border-white/70 bg-white/15 group-hover:bg-white/35 group-hover:border-white transition-all shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                  {/* Inner dot */}
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/90 group-hover:bg-white" />
                </span>
                {/* Label below */}
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-white/80 text-[10px] font-medium whitespace-nowrap bg-black/40 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hs.label}
                </span>
              </button>
              {/* 편집모드 삭제 버튼 */}
              {editMode && (
                <button
                  type="button"
                  title="삭제"
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold flex items-center justify-center shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onHotspotDelete?.(hs); }}
                >
                  X
                </button>
              )}
            </div>
          );
        }

        return (
          <div
            key={hs.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group"
            style={{ left: pos.x, top: pos.y, pointerEvents: "auto" }}
          >
            <button
              type="button"
              className={`transition-all ${
                hs.type === "valve"
                  ? "px-2.5 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-400/50"
                  : "px-2.5 py-1.5 rounded-lg bg-primary/80 hover:bg-primary border border-primary/50"
              } backdrop-blur-sm`}
              onClick={(e) => {
                e.stopPropagation();
                onHotspotClick?.(hs);
              }}
            >
              <span className="text-white text-xs font-bold whitespace-nowrap">{hs.label}</span>
            </button>
            {/* 편집모드 삭제 버튼 */}
            {editMode && (
              <button
                type="button"
                title="삭제"
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold flex items-center justify-center shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onHotspotDelete?.(hs); }}
              >
                X
              </button>
            )}
          </div>
        );
      })}

      {/* Off-screen hotspot edge indicators */}
      {!loading && hotspots.map((hs) => {
        const edgePos = getHotspotEdgePos(hs);
        if (!edgePos) return null;

        const isValve = hs.type === "valve";
        const isNav = hs.type === "nav";
        const color = isValve ? "#10b981" : isNav ? "#ffffff" : "#3b82f6";
        const bgClass = isValve
          ? "bg-emerald-500/20 border-emerald-500/50"
          : isNav
            ? "bg-white/15 border-white/40"
            : "bg-blue-500/20 border-blue-500/50";

        return (
          <button
            key={`edge-${hs.id}`}
            type="button"
            className={`absolute z-10 group/edge flex items-center gap-1 rounded-full border backdrop-blur-sm px-1.5 py-1 hover:scale-110 transition-transform ${bgClass}`}
            style={{
              left: edgePos.x,
              top: edgePos.y,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
            }}
            onClick={(e) => {
              e.stopPropagation();
              rotateToHotspot(hs);
            }}
          >
            {/* Arrow icon */}
            <svg
              width="14" height="14" viewBox="0 0 14 14"
              style={{ transform: `rotate(${edgePos.angle}deg)`, flexShrink: 0 }}
            >
              <polygon points="12,7 3,2 5,7 3,12" fill={color} opacity="0.9" />
            </svg>
            {/* Label */}
            <span className="text-[9px] text-white/80 font-medium whitespace-nowrap max-w-[60px] truncate">
              {hs.label}
            </span>
          </button>
        );
      })}

      {/* Controls hint */}
      {!loading && !editMode && (
        <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white/60 text-xs flex items-center gap-2 pointer-events-none">
          드래그: 회전 | 스크롤: 줌
        </div>
      )}
    </div>
  );
}
