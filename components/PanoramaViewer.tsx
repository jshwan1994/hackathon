"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";

interface PanoramaViewerProps {
  imageUrl: string;
  hotspots?: Hotspot[];
  onHotspotClick?: (hotspot: Hotspot) => void;
  onPanoramaClick?: (coords: { yaw: number; pitch: number }) => void;
  onViewChange?: (yaw: number, pitch: number) => void;
  editMode?: boolean;
  className?: string;
  initialYaw?: number;
  initialPitch?: number;
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
  onPanoramaClick,
  onViewChange,
  editMode = false,
  className = "",
  initialYaw = 0,
  initialPitch = 0,
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
        }
        // Set rotation only after new texture is applied — no jarring twist
        rotationRef.current = { lon: initialYawRef.current, lat: initialPitchRef.current };
        setLoading(false);
      },
      undefined,
      () => setLoading(false)
    );
  }, [imageUrl]);

  // Convert screen click to yaw/pitch
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
            <button
              type="button"
              key={hs.id}
              title={hs.label}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group"
              style={{ left: pos.x, top: pos.y, pointerEvents: "auto" }}
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
          );
        }

        return (
          <button
            type="button"
            key={hs.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all ${
              hs.type === "valve"
                ? "px-2.5 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-400/50"
                : "px-2.5 py-1.5 rounded-lg bg-primary/80 hover:bg-primary border border-primary/50"
            } backdrop-blur-sm`}
            style={{ left: pos.x, top: pos.y, pointerEvents: "auto" }}
            onClick={(e) => {
              e.stopPropagation();
              onHotspotClick?.(hs);
            }}
          >
            <span className="text-white text-xs font-bold whitespace-nowrap">{hs.label}</span>
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
