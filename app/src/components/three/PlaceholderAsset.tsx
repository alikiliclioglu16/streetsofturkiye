'use client';

import { useMemo } from 'react';
import type { ResolvedAsset } from '@/engine/assets/registry';

interface PlaceholderAssetProps {
  asset: ResolvedAsset;
  emphasis?: boolean;
}

/**
 * Draws primitive geometry for an asset that has no GLB yet.
 * Shape and size come from the manifest `fallback` and `dimensions_m` columns,
 * so the graybox composition stays close to the delivered models' footprint
 * (D-008).
 */
export function PlaceholderAsset({ asset, emphasis = false }: PlaceholderAssetProps) {
  const { entry, isUnknown } = asset;
  const [width, height, depth] = entry.dimensions;

  const material = useMemo(
    () => ({
      color: isUnknown ? '#E0322F' : entry.color,
      roughness: 0.75,
      metalness: 0.05,
      emissive: emphasis ? entry.color : '#000000',
      emissiveIntensity: emphasis ? 0.35 : 0,
    }),
    [entry.color, emphasis, isUnknown],
  );

  switch (entry.placeholder) {
    case 'cylinder':
      return (
        <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
          <cylinderGeometry args={[width / 2, width / 2, height, 16]} />
          <meshStandardMaterial {...material} />
        </mesh>
      );
    case 'sphere':
      return (
        <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
          <sphereGeometry args={[Math.max(width, height) / 2, 20, 14]} />
          <meshStandardMaterial {...material} />
        </mesh>
      );
    case 'plane':
      return (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh position={[0, -height / 2 - 0.5, 0]} castShadow>
            <boxGeometry args={[0.12, 1, 0.12]} />
            <meshStandardMaterial color="#6B7280" roughness={0.9} />
          </mesh>
        </group>
      );
    case 'box':
    default:
      return (
        <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial {...material} />
        </mesh>
      );
  }
}
