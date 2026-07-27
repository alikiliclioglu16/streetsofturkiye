'use client';

import type { PerfSample } from '@/components/three/CityCanvas';

/** Development overlay required by Phase 01 acceptance. */
export function PerfOverlay({ sample, quality }: { sample: PerfSample | null; quality: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 10,
        bottom: 10,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(22, 50, 79, 0.82)',
        color: '#FFF8E7',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        lineHeight: 1.5,
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      <div>fps {sample?.fps ?? '—'} · {quality}</div>
      <div>draw {sample?.drawCalls ?? '—'} · tris {sample?.triangles?.toLocaleString('tr-TR') ?? '—'}</div>
      <div>geo {sample?.geometries ?? '—'} · tex {sample?.textures ?? '—'}</div>
    </div>
  );
}
