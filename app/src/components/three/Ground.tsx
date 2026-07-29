'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { SceneGround } from '@/engine/scene/buildScene';

/** Metres covered by one tile of the cobblestone texture. */
const TILE_METRES = 4;

/**
 * How far the paving runs past the edge of the play area.
 *
 * The ground used to end exactly where the child could walk, so the facades
 * standing beyond that edge appeared to float over a strip of sky. Ground is
 * scenery; bounds are gameplay, and they are not the same rectangle.
 */
const GROUND_MARGIN = 26;

/**
 * The street surface.
 *
 * This is the largest thing on screen and was a flat colour, which left every
 * prop looking like it hovered over a void however carefully its base was
 * measured onto y = 0.
 *
 * The texture is greyscale and the region's own ground colour tints it, so one
 * 368 KB set serves all 81 provinces and Cappadocia still reads as Cappadocia.
 */
export function Ground({ ground }: { ground: SceneGround }) {
  const loaded = useTexture([
    '/assets/textures/ground_cobblestone_albedo.jpg',
    '/assets/textures/ground_cobblestone_normal.jpg',
    '/assets/textures/ground_cobblestone_roughness.jpg',
  ]) as Texture[];
  const [albedo, normal, roughness] = loaded;

  const maps = useMemo(() => {
    const repeatX = Math.max(1, Math.round((ground.width + GROUND_MARGIN * 2) / TILE_METRES));
    const repeatY = Math.max(1, Math.round((ground.depth + GROUND_MARGIN * 2) / TILE_METRES));

    const prepare = (texture: Texture, colour: boolean) => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.anisotropy = 8;
      // Only the colour map is sRGB; the others carry data, not colour.
      if (colour) texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    };

    if (!albedo || !normal || !roughness) return {};
    return {
      map: prepare(albedo, true),
      normalMap: prepare(normal, false),
      roughnessMap: prepare(roughness, false),
    };
  }, [albedo, normal, roughness, ground.width, ground.depth]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[ground.centerX, 0, ground.centerZ]}
      receiveShadow
    >
      <planeGeometry args={[ground.width + GROUND_MARGIN * 2, ground.depth + GROUND_MARGIN * 2]} />
      <meshStandardMaterial
        {...maps}
        color={ground.color}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}
