'use client';

import { useMemo } from 'react';
import type { Locale } from '@/content/i18n';
import { t } from '@/content/i18n';
import type { CityIndexEntry } from '@/content/loaders/loadCityIndex';
import type { CanonicalRegion as Region } from '@/content/schemas/canonical';

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 420;
const LON_MIN = 25.6;
const LON_MAX = 45.0;
const LAT_MIN = 35.6;
const LAT_MAX = 42.3;

function project(longitude: number, latitude: number): { x: number; y: number } {
  const x = ((longitude - LON_MIN) / (LON_MAX - LON_MIN)) * VIEW_WIDTH;
  const y = VIEW_HEIGHT - ((latitude - LAT_MIN) / (LAT_MAX - LAT_MIN)) * VIEW_HEIGHT;
  return { x, y };
}

export type CityAvailability = 'playable' | 'pilot' | 'locked';

interface TurkiyeMapProps {
  cities: readonly CityIndexEntry[];
  regions: readonly Region[];
  locale: Locale;
  availability: (cityId: string) => CityAvailability;
  completedCityIds: readonly string[];
  onSelect: (cityId: string) => void;
}

/**
 * All 81 provinces are plotted from the legacy coordinates so the adapter path
 * to the full dataset is visible from day one. Availability is carried by size,
 * shape and label, never by colour alone (PRODUCT_REQUIREMENTS section 9).
 */
export function TurkiyeMap({
  cities,
  regions,
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
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="group"
      aria-label={locale === 'tr' ? 'Türkiye il haritası' : 'Province map of Türkiye'}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {cities.map((city) => {
        const { x, y } = project(city.coordinates.longitude, city.coordinates.latitude);
        const state = availability(city.id);
        const color = regionColor(city.regionId);
        const isDone = completed.has(city.id);
        const label = t(city.name, locale);

        if (state === 'locked') {
          return (
            <circle
              key={city.id}
              cx={x}
              cy={y}
              r={3.4}
              fill={color}
              opacity={0.34}
              aria-hidden="true"
            />
          );
        }

        return (
          <g
            key={city.id}
            role="button"
            tabIndex={0}
            aria-label={
              state === 'playable'
                ? `${label} — ${locale === 'tr' ? 'oynanabilir' : 'playable'}`
                : `${label} — ${locale === 'tr' ? 'yakında' : 'coming soon'}`
            }
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
              <circle cx={x} cy={y} r={15} fill="none" stroke={color} strokeWidth={2.5} />
            ) : (
              <circle
                cx={x}
                cy={y}
                r={13}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeDasharray="4 4"
              />
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
              fontSize={17}
              fontWeight={650}
              fill="#16324F"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
