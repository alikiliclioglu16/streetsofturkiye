'use client';

/** Vertical field of view. Narrower than the first pass, which framed the guide too small. */
export const CAMERA_FOV = 50;

import { useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { QualitySettings } from '@/engine/quality/quality';

export interface PerfSample {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

interface PerfProbeProps {
  onSample: (sample: PerfSample) => void;
}

/**
 * Samples renderer statistics twice per second. React state is updated at that
 * rate rather than per frame (PERFORMANCE_BUDGET, engineering checks).
 */
function PerfProbe({ onSample }: PerfProbeProps) {
  const { gl } = useThree();
  const frames = useRef(0);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    frames.current += 1;
    elapsed.current += delta;
    if (elapsed.current < 0.5) return;

    const info = gl.info;
    onSample({
      fps: Math.round(frames.current / elapsed.current),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
    });
    frames.current = 0;
    elapsed.current = 0;
  });

  return null;
}

interface CityCanvasProps {
  quality: QualitySettings;
  /** Zenith colour for this region; the scene adds matching haze. */
  skyColor: string;
  children: ReactNode;
  onPerfSample?: (sample: PerfSample) => void;
}

export function CityCanvas({ quality, skyColor, children, onPerfSample }: CityCanvasProps) {
  return (
    <Canvas
      shadows={quality.heroShadow || quality.shadowMapSize > 512}
      dpr={[1, quality.maxDpr]}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 220, position: [0, 2.6, 9] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(skyColor);
      }}
    >
      {children}
      {/* Always sampling: adaptive quality depends on it, not just the overlay. */}
      {onPerfSample ? <PerfProbe onSample={onPerfSample} /> : null}
    </Canvas>
  );
}
