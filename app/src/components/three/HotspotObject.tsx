'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { SceneHotspot } from '@/engine/scene/buildScene';
import { AssetInstance } from '@/components/three/AssetInstance';

export interface InspectTarget {
  id: string;
  /** Angle in radians around the object's Y axis. */
  angle: number;
  shape: 'cone' | 'box' | 'sphere';
}

/**
 * Three motif markers sit around the object. Only one matches the target id in
 * content, so the child has to turn the object before choosing. Shapes stand in
 * for the real İznik motifs until the panel model arrives.
 */
export function inspectTargets(targetId: string): InspectTarget[] {
  return [
    { id: targetId, angle: Math.PI, shape: 'cone' },
    { id: `${targetId}-decoy-a`, angle: Math.PI / 2, shape: 'box' },
    { id: `${targetId}-decoy-b`, angle: -Math.PI / 2, shape: 'sphere' },
  ];
}

interface HotspotObjectProps {
  hotspot: SceneHotspot;
  completed: boolean;
  inRange: boolean;
  /** Non-null while this hotspot's inspect interaction is active. */
  inspect: { targetId: string; spin: number; onPick: (id: string) => void } | null;
  reducedMotion: boolean;
}

export function HotspotObject({
  hotspot,
  completed,
  inRange,
  inspect,
  reducedMotion,
}: HotspotObjectProps) {
  const spinRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const targets = useMemo(
    () => (inspect ? inspectTargets(inspect.targetId) : []),
    [inspect],
  );

  useFrame((_, delta) => {
    if (spinRef.current && inspect) {
      // Rotation is driven by input, applied outside React state.
      spinRef.current.rotation.y += (inspect.spin - spinRef.current.rotation.y) * Math.min(1, delta * 8);
    }
    if (ringRef.current && !reducedMotion && inRange && !completed) {
      ringRef.current.rotation.z += delta * 0.6;
    }
  });

  const ringColor = completed ? '#4CAF7D' : inRange ? '#F2B233' : '#3EC6C9';

  return (
    <group position={hotspot.position}>
      {/* Trigger ring: shape and label carry the state, not colour alone. */}
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
        <group ref={spinRef}>
          <AssetInstance asset={hotspot.asset} emphasis={inRange && !completed} />

          {targets.map((target) => {
            const radius = Math.max(hotspot.asset.entry.dimensions[0], 1) * 0.55;
            const position: [number, number, number] = [
              Math.sin(target.angle) * radius,
              0.15,
              Math.cos(target.angle) * radius,
            ];
            return (
              <mesh
                key={target.id}
                position={position}
                onClick={(event) => {
                  event.stopPropagation();
                  inspect?.onPick(target.id);
                }}
                onPointerOver={(event) => {
                  event.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'auto';
                }}
              >
                {target.shape === 'cone' ? (
                  <coneGeometry args={[0.16, 0.34, 12]} />
                ) : target.shape === 'box' ? (
                  <boxGeometry args={[0.26, 0.26, 0.26]} />
                ) : (
                  <sphereGeometry args={[0.17, 14, 10]} />
                )}
                <meshStandardMaterial color="#FFF8E7" roughness={0.4} emissive="#F2B233" emissiveIntensity={0.25} />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
}
