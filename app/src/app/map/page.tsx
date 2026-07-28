'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadPresentation,
  loadRegions,
  PILOT_CITY_IDS,
  PLAYABLE_CITY_IDS,
} from '@/content/loaders/loadCity';
import { loadCityIndex, type CityIndexEntry } from '@/content/loaders/loadCityIndex';
import type { CanonicalRegion as Region } from '@/content/schemas/canonical';
import type { Presentation } from '@/content/schemas/presentation';
import { t, ui } from '@/content/i18n';
import { TurkiyeMap, type CityAvailability } from '@/components/map/TurkiyeMap';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGameStore } from '@/stores/useGameStore';
import { SettingsPanel } from '@/components/game-ui/SettingsPanel';
import { GuidePortrait } from '@/components/map/GuidePortrait';

export default function MapPage() {
  const router = useRouter();
  const locale = useSettingsStore((state) => state.locale);
  const hydrate = useSettingsStore((state) => state.hydrate);
  const profile = useGameStore((state) => state.profile);
  const loadProfile = useGameStore((state) => state.loadProfile);
  const settingsOpen = useGameStore((state) => state.settingsOpen);
  const toggleSettings = useGameStore((state) => state.toggleSettings);

  const [cities, setCities] = useState<CityIndexEntry[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    void loadProfile();
  }, [hydrate, loadProfile]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      loadCityIndex(controller.signal),
      loadRegions(controller.signal),
      loadPresentation(controller.signal),
    ])
      .then(([cityList, regionList, presentationData]) => {
        setCities(cityList);
        setRegions(regionList);
        setPresentation(presentationData);
      })
      .catch((cause: Error) => {
        if (controller.signal.aborted) return;
        setError(cause.message);
      });
    return () => controller.abort();
  }, []);

  const availability = useMemo(() => {
    const playable = new Set<string>(PLAYABLE_CITY_IDS);
    const pilot = new Set<string>(PILOT_CITY_IDS);
    return (cityId: string): CityAvailability => {
      if (playable.has(cityId)) return 'playable';
      if (pilot.has(cityId)) return 'pilot';
      return 'locked';
    };
  }, []);

  const pilotCities = useMemo(
    () => cities.filter((city) => (PILOT_CITY_IDS as readonly string[]).includes(city.id)),
    [cities],
  );

  const regionName = (regionId: string) =>
    t(regions.find((region) => region.id === regionId)?.name, locale);

  return (
    <main
      style={{
        minHeight: '100dvh',
        padding: 'clamp(20px, 4vw, 48px)',
        maxWidth: 1160,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p
            style={{
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--cini-blue)',
            }}
          >
            {ui('appTagline', locale)}
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.1rem)', lineHeight: 1.05 }}>
            {ui('appTitle', locale)}
          </h1>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => toggleSettings(true)}>
          {ui('settings', locale)}
        </button>
      </header>

      <section className="panel" style={{ padding: 'clamp(14px, 3vw, 28px)' }} aria-live="polite">
        {error ? (
          <p style={{ color: 'var(--flag-red)', margin: 0 }}>{error}</p>
        ) : cities.length === 0 ? (
          <p style={{ margin: 0 }}>{ui('loading', locale)}…</p>
        ) : (
          <>
            <TurkiyeMap
              cities={cities}
              regions={regions}
              presentation={presentation}
              locale={locale}
              availability={availability}
              completedCityIds={profile.completedCityIds}
              onSelect={(cityId) => router.push(`/city/${cityId}`)}
            />
            <p style={{ fontSize: 13, opacity: 0.72, margin: '10px 2px 0' }}>
              {`All ${cities.length} provinces are on the map. ${PLAYABLE_CITY_IDS.length} of them ` +
                `${PLAYABLE_CITY_IDS.length === 1 ? 'is' : 'are'} open to explore so far — ` +
                `the rest already have their stories written and are waiting for their streets.`}
            </p>
          </>
        )}
      </section>

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {pilotCities.map((city) => {
          const state = availability(city.id);
          const done = profile.completedCityIds.includes(city.id);
          const visited = profile.visitedCityIds.includes(city.id);
          return (
            <article
              key={city.id}
              className="panel"
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* 2D portrait only — the map route never loads a 3D hero. */}
                  <GuidePortrait guideId={city.legacyGuideId} />
                  <h2 style={{ fontSize: '1.5rem' }}>{t(city.name, locale)}</h2>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>
                  {regionName(city.regionId)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>
                {done
                  ? `★ ${ui('cityComplete', locale)}`
                  : visited
                    ? `• ${ui('inProgress', locale)}`
                    : `${city.stopCount} ${ui('playableNote', locale)}`}
              </p>
              {state === 'playable' ? (
                <button type="button" className="btn" onClick={() => router.push(`/city/${city.id}`)}>
                  {ui('startCity', locale)}
                </button>
              ) : (
                <button type="button" className="btn btn--ghost" disabled style={{ opacity: 0.55 }}>
                  {ui('notOpenYet', locale)}
                </button>
              )}
            </article>
          );
        })}
      </section>

      {settingsOpen ? <SettingsPanel /> : null}
    </main>
  );
}
