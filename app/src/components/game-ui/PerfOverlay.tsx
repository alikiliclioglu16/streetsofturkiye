'use client';

import type { PerfSample } from '@/components/three/CityCanvas';
import type { HeroStatus } from '@/components/three/HeroCharacter';
import { environmentConcessions, type QualityProfile } from '@/engine/heroes/policy';
import { checkHeroBudget, heroById } from '@/engine/heroes/registry';
import { heroCacheSnapshot } from '@/engine/heroes/heroCache';

/**
 * Development telemetry (hero policy rule 9). Everything here answers the same
 * question: is the frame budget going to the environment, as intended, rather
 * than to the hero character.
 */
export function PerfOverlay({
  sample,
  profile,
  hero,
  interactionState,
  celebrationState,
  heroHeightMeters,
  autoSteps,
}: {
  sample: PerfSample | null;
  profile: QualityProfile;
  hero: HeroStatus | null;
  interactionState?: string;
  celebrationState?: string;
  /** Rendered height before scaling; a wildly small value means a broken bind. */
  heroHeightMeters?: number | null;
  /** Profiles the engine stepped down to on its own. */
  autoSteps?: readonly string[];
}) {
  const cache = heroCacheSnapshot();
  const definition = hero ? heroById(hero.heroId) : null;
  const budget = definition ? checkHeroBudget(definition) : null;
  const concessions = environmentConcessions(profile);

  const row = (label: string, value: string) => (
    <div key={label} style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span>{value}</span>
    </div>
  );

  const megabytes = definition?.transferBytes
    ? `${(definition.transferBytes / 1024 / 1024).toFixed(1)} MB`
    : '—';

  return (
    <div
      style={{
        position: 'absolute',
        right: 10,
        bottom: 10,
        width: 268,
        padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(22, 50, 79, 0.86)',
        color: '#FFF8E7',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        lineHeight: 1.6,
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      {row('fps', String(sample?.fps ?? '—'))}
      {row('profile', autoSteps && autoSteps.length > 0 ? `${profile.id} (auto ↓${autoSteps.length})` : profile.id)}
      {row('dpr cap', String(profile.maxDpr))}
      {row('draw calls', String(sample?.drawCalls ?? '—'))}
      {row('triangles', sample?.triangles?.toLocaleString('en-US') ?? '—')}
      {row('geo / tex', `${sample?.geometries ?? '—'} / ${sample?.textures ?? '—'}`)}

      <hr style={{ border: 0, borderTop: '1px solid rgba(255,248,231,0.2)', margin: '6px 0' }} />

      {row('hero', definition?.displayName ?? '—')}
      {row('hero state', hero?.state ?? '—')}
      {row('clip', hero?.clipName ?? hero?.clip ?? '—')}
      {row('hero shadow', hero ? (hero.shadow ? 'on' : 'off') : '—')}
      {row('hero tris', budget?.triangles?.toLocaleString('en-US') ?? 'not delivered')}
      {row(
        'measured h',
        heroHeightMeters != null ? `${heroHeightMeters.toFixed(3)} m` : '—',
      )}
      {row('interaction', interactionState ?? '—')}
      {row('celebration', celebrationState ?? '—')}
      {row('glb size', megabytes)}
      {row('resident', cache.resident.length > 0 ? cache.resident.join(', ') : 'none')}
      {row('requests', String(cache.requests.length))}

      {concessions.length > 0 ? (
        <>
          <hr style={{ border: 0, borderTop: '1px solid rgba(255,248,231,0.2)', margin: '6px 0' }} />
          <div style={{ opacity: 0.65 }}>environment concessions</div>
          {concessions.map((item) => (
            <div key={item}>· {item}</div>
          ))}
        </>
      ) : null}
    </div>
  );
}
