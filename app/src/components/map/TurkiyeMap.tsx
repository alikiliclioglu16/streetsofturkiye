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
 * The land was briefly filled with a relief render of the delivered
 * `Anatolian Highlands` terrain. The owner looked at it and said no, so the
 * flat wash is back. The measurement that came out of that attempt is still
 * worth keeping: the plate is 1.28 times wider than it is deep against
 * Türkiye's 2.33, and three of the nineteen target cities fell off it
 * altogether (D-218, D-221).
 */
const project = (longitude: number, latitude: number) => ({
  x: Math.round((longitude - 25.55) * 50 * 10) / 10,
  y: Math.round((30 + (42.25 - latitude) * 65) * 10) / 10,
});

/**
 * What a province is on the map.
 *
 * `planned` replaced `pilot`, which had become a branch nothing reached: it
 * meant the three cities the pilot was judged on, and all three have been
 * playable since Kars opened (D-123), so the check above it always won. What
 * the map actually needs to say now is "this one is coming", which is a
 * different idea and belongs to the nineteen rather than to the three.
 *
 * `locked` is every other province. They are no longer drawn — see below.
 */
/**
 * Cities whose name is drawn under the dot rather than over it.
 *
 * Derived rather than eyeballed: every label box is checked against every other
 * label box and every other dot, and this is the smallest set that clears all
 * of them. Re-run that check when a city joins the map.
 */
const LABEL_BELOW = new Set<string>(['mardin']);

export type CityAvailability = 'playable' | 'planned' | 'locked';

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

      </defs>

      <rect x="0" y="0" width="1000" height="500" fill="url(#sot-sea)" />

      {presentation?.map.landPaths.map((d, index) => (
        <path
          key={`land-${index}`}
          d={d}
          fill="url(#sot-land)"
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

        /**
         * A province outside the nineteen is not drawn at all.
         *
         * It used to be a faint dot, and that was right while the plan was the
         * whole country: sixty-eight quiet dots said "your province is coming".
         * Against a nineteen-city product they say the opposite — a child finds
         * their own town on the map, taps it, and nothing happens, which is a
         * promise the project is no longer making.
         *
         * Their canonical content is untouched and the loader can still reach
         * them; this is only what the map shows.
         */
        if (state === 'locked') return null;

        return (
          <g
            key={city.id}
            role="button"
            tabIndex={0}
            aria-label={`${label} — ${state === 'playable' ? 'open to explore' : 'coming soon'}`}
            aria-disabled={state === 'planned'}
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
            {/*
              A planned city is hollow. With the locked dots gone, a solid
              filled disc would make the six read as open — the dashed ring
              alone is not enough of a difference at map scale, and the first
              thing a child does is tap one.
            */}
            <circle
              cx={x}
              cy={y}
              r={7.5}
              fill={state === 'planned' ? '#FFF8E7' : isDone ? '#4CAF7D' : color}
              stroke={state === 'planned' ? color : 'none'}
              strokeWidth={state === 'planned' ? 2.5 : 0}
            />
            {isDone ? (
              <path
                d={`M ${x - 3.4} ${y} l 2.4 2.6 l 4.6 -5.2`}
                fill="none"
                stroke="#FFF8E7"
                strokeWidth={2}
                strokeLinecap="round"
              />
            ) : null}
            {/*
              Labels sit above their dot, except where that collides.
              
              At thirteen cities nothing clashed. At nineteen, one pair does:
              Diyarbakır and Mardin are 70 km apart and Mardin's label landed on
              top of Diyarbakır's dot. Measuring every label box against every
              other label and dot, dropping Mardin below clears it completely
              (0 collisions) while dropping Diyarbakır instead makes it worse
              (3), because its label then lands on Mardin's.
            */}
            <text
              x={x}
              y={LABEL_BELOW.has(city.id) ? y + 30 : y - 22}
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
