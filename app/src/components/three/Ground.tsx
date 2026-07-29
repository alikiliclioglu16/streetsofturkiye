'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { pendingTap } from '@/engine/controls/inputState';
import type { SceneGround } from '@/engine/scene/buildScene';

/** Metres covered by one tile of the cobblestone texture. */
const TILE_METRES = 4;

/**
 * Sand tiles larger than paving.
 *
 * A cobble is 44 cm and repeating it every four metres is what a street looks
 * like. Dust has no unit, so the same repeat reads as a pattern; stretching it
 * lets it read as ground.
 */
const SURFACE_TILE = { cobblestone: 4, redsand: 9 } as const;

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
export function Ground({
  ground,
  surface,
}: {
  ground: SceneGround;
  /** Which region's surface this is: paving on the coast, dust on the plateau. */
  surface: 'cobblestone' | 'redsand';
}) {
  const loaded = useTexture([
    `/assets/textures/ground_${surface}_albedo.jpg`,
    `/assets/textures/ground_${surface}_normal.jpg`,
    `/assets/textures/ground_${surface}_roughness.jpg`,
  ]) as Texture[];
  const [albedo, normal, roughness] = loaded;

  const maps = useMemo(() => {
    const tile = SURFACE_TILE[surface] ?? TILE_METRES;
    const repeatX = Math.max(1, Math.round((ground.width + GROUND_MARGIN * 2) / tile));
    const repeatY = Math.max(1, Math.round((ground.depth + GROUND_MARGIN * 2) / tile));

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
  }, [albedo, normal, roughness, ground.width, ground.depth, surface]);

  return (
    <mesh
      /**
       * Tapping the ground walks there.
       *
       * The stick works — the whole game runs on a tablet — but it takes
       * getting used to, and getting used to a joystick is not what this
       * product is for. Tapping where you want to go is the control every child
       * already knows.
       */
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        pendingTap.point = { x: event.point.x, z: event.point.z };
      }}
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
