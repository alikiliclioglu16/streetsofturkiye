'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { SceneHotspot } from '@/engine/scene/buildScene';
import { AssetInstance } from '@/components/three/AssetInstance';

interface HotspotObjectProps {
  hotspot: SceneHotspot;
  completed: boolean;
  inRange: boolean;
  reducedMotion: boolean;
}

/**
 * A stop in the world: the object itself and the ring the player steps into.
 *
 * There is nothing to solve here. Walking into the ring opens the stop; the
 * card presents it and offers the collectible.
 */
export function HotspotObject({ hotspot, completed, inRange, reducedMotion }: HotspotObjectProps) {
  const ringRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current && !reducedMotion && inRange && !completed) {
      ringRef.current.rotation.z += delta * 0.6;
    }
  });

  const ringColor = completed ? '#4CAF7D' : inRange ? '#F2B233' : '#3EC6C9';

  return (
    <group position={hotspot.position}>
      {/* State is carried by shape and colour together, never colour alone. */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -hotspot.position[1] + 0.02, 0]}
        receiveShadow
      >
        <ringGeometry args={[hotspot.triggerRadius - 0.28, hotspot.triggerRadius, 40]} />
        <meshBasicMaterial color={ringColor} transparent opacity={completed ? 0.5 : 0.9} />
      </mesh>

      <group rotation={hotspot.rotation} scale={hotspot.scale}>
        <AssetInstance asset={hotspot.asset} emphasis={inRange && !completed} />
      </group>
    </group>
  );
}
