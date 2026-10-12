'use client';

import { useMemo } from 'react';
import type { Locale } from '@/content/i18n';
import { t } from '@/content/i18n';
import type { CityIndexEntry } from '@/content/loaders/loadCityIndex';
import type { CanonicalRegion as Region } from '@/content/schemas/canonical';
import type { Presentation } from '@/content/schemas/presentation';

/**
 * The map of Türkiye.
 *
 * The land outline and this projection both come from the source: the province
 * dots have to land on the coastline, so inventing either one puts every city
 * in the sea. An earlier build drew a bare scatter of dots with no country
 * behind them.
 *
 * **The land is now relief rather than a flat wash**, filled from
 * `map_relief.jpg` — a top-down render of the delivered `Anatolian Highlands`
 * terrain, lit from the north-west the way relief maps are, and clipped to the
 * country.
 *
 * Clipped, and not used as the map itself, because it is not Türkiye. The
 * delivery is a terrain plate 1.28 times wider than it is deep; Türkiye is
 * 2.33. Mapping the nineteen target cities onto that plate by longitude and
 * latitude puts **three of them — Trabzon, İstanbul and Antalya — off the model
 * entirely**, which is this comment's own warning happening in practice. So the
 * outline, the projection and every dot stay exactly where the source put them,
 * and what the terrain supplies is the surface inside them.
 */
const project = (longitude: number, latitude: number) => ({
  x: Math.round((longitude - 25.55) * 50 * 10) / 10,
  y: Math.round((30 + (42.25 - latitude) * 65) * 10) / 10,
});

export type CityAvailability = 'playable' | 'pilot' | 'locked';

interface TurkiyeMapProps {
  cities: readonly CityIndexEntry[];
  regions: readonly Region[];
  presentation: Presentation | null;
  locale: Locale;
  availability: (cityId: string) => CityAvailability;
  completedCityIds: readonly string[];
  onSelect: (cityId: string) => void;
}

export function TurkiyeMap({
  cities,
  regions,
  presentation,
  locale,
  availability,
  completedCityIds,
  onSelect,
}: TurkiyeMapProps) {
  const regionColor = useMemo(() => {
    const map = new Map(regions.map((region) => [region.id, region.sourceVisual.color]));
    return (regionId: string) => map.get(regionId) ?? '#16324F';
  }, [regions]);

  const completed = useMemo(() => new Set(completedCityIds), [completedCityIds]);

  return (
    <svg
      viewBox={presentation?.map.viewBox ?? '0 0 1000 500'}
      role="group"
      aria-label="Map of Türkiye"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <linearGradient id="sot-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4FC9E8" />
          <stop offset="1" stopColor="#1B8FC4" />
        </linearGradient>
        <linearGradient id="sot-land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8DCBF" />
          <stop offset="1" stopColor="#D6C49A" />
        </linearGradient>

        {/*
          The relief, laid over the land box the source paths occupy — x 26 to
          963.5, y 43 to 447.9 in a 1000 x 500 viewBox. `patternUnits` is user
          space so the image sits at that fixed place on the map rather than
          repeating per shape: the four land paths (the mainland and three
          islands) then read as windows cut into one continuous country.

          `preserveAspectRatio="none"` on purpose. The terrain is being used as
          a surface, not as a place, and letting it letterbox would leave the
          flat gradient showing at the top and bottom of the land.
        */}
        <pattern
          id="sot-relief"
          patternUnits="userSpaceOnUse"
          x={26}
          y={43}
          width={937.5}
          height={404.9}
        >
          <rect x="0" y="0" width="937.5" height="404.9" fill="url(#sot-land)" />
          <image
            href="/assets/textures/map_relief.jpg"
            x="0"
            y="0"
            width="937.5"
            height="404.9"
            preserveAspectRatio="none"
          />
        </pattern>
      </defs>

      <rect x="0" y="0" width="1000" height="500" fill="url(#sot-sea)" />

      {presentation?.map.landPaths.map((d, index) => (
        <path
          key={`land-${index}`}
          d={d}
          fill="url(#sot-relief)"
          stroke="#FFF8E7"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}

      {cities.map((city) => {
        const { x, y } = project(city.coordinates.longitude, city.coordinates.latitude);
        const state = availability(city.id);
        const color = regionColor(city.regionId);
        const isDone = completed.has(city.id);
        const label = t(city.name, locale);

        if (state === 'locked') {
          return <circle key={city.id} cx={x} cy={y} r={4} fill={color} opacity={0.5} aria-hidden="true" />;
        }

        return (
          <g
            key={city.id}
            role="button"
            tabIndex={0}
            aria-label={`${label} — ${state === 'playable' ? 'open to explore' : 'coming soon'}`}
            aria-disabled={state === 'pilot'}
            style={{ cursor: state === 'playable' ? 'pointer' : 'not-allowed' }}
            onClick={() => state === 'playable' && onSelect(city.id)}
            onKeyDown={(event) => {
              if (state !== 'playable') return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(city.id);
              }
            }}
          >
            {state === 'playable' ? (
              <circle cx={x} cy={y} r={15} fill="none" stroke={color} strokeWidth={3} />
            ) : (
              <circle cx={x} cy={y} r={13} fill="none" stroke={color} strokeWidth={2} strokeDasharray="4 4" />
            )}
            <circle cx={x} cy={y} r={7.5} fill={isDone ? '#4CAF7D' : color} />
            {isDone ? (
              <path
                d={`M ${x - 3.4} ${y} l 2.4 2.6 l 4.6 -5.2`}
                fill="none"
                stroke="#FFF8E7"
                strokeWidth={2}
                strokeLinecap="round"
              />
            ) : null}
            <text
              x={x}
              y={y - 22}
              textAnchor="middle"
              fontSize={18}
              fontWeight={700}
              fill="#16324F"
              stroke="#FFF8E7"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
