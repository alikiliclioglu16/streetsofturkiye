'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Group, Mesh, Object3D } from 'three';
import { Box3, Vector3 } from 'three';
import type { ResolvedAsset } from '@/engine/assets/registry';
import { PlaceholderAsset } from '@/components/three/PlaceholderAsset';

/**
 * Single rendering path for every asset in the game (Gate A finding A-02).
 *
 * Callers pass a ResolvedAsset, never a path. When the registry has a GLB the
 * model is loaded through useGLTF; in every other case — no model yet, unknown
 * id, network failure, malformed file — the documented placeholder is drawn
 * and the city keeps running.
 *
 * Caching and disposal: useGLTF caches by URL for the lifetime of the page, so
 * re-entering a city reuses the parsed model instead of re-downloading it. The
 * cloned scene graph is dropped when this component unmounts; the cached source
 * is released with `useGLTF.clear(url)` in `releaseModel`, which the city route
 * calls when a city is left for good.
 */

interface ModelProps {
  url: string;
  asset: ResolvedAsset;
  castShadow: boolean;
}

function Model({ url, asset, castShadow }: ModelProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);

  /**
   * Clone so two instances of the same GLB do not share one transform.
   *
   * `SkeletonUtils.clone` rather than `Object3D.clone`, because a plain clone
   * of a skinned mesh keeps a reference to the ORIGINAL bones: the copy's own
   * skeleton drives nothing and the mesh falls back to its node transform. That
   * is what rendered Nasreddin Hodja 1.7 cm tall, and the street cat is skinned
   * too. The call is harmless on unskinned props.
   */
  const model = useMemo(() => cloneSkinned(scene), [scene]);

  /**
   * A contact shadow is what tells the eye an object stands on the ground
   * rather than hovering above it. The first props were grounded correctly and
   * still read as floating, because nothing they cast reached the floor. Two
   * kit props cost roughly 3,400 triangles in the shadow pass, which is nothing
   * beside the guide's 197,000.
   */
  useEffect(() => {
    model.traverse((child: Object3D) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
    });
  }, [model, castShadow]);

  /**
   * Scale the model to its recorded height, then stand it on the ground.
   *
   * Meshy exports arrive at inconsistent scales and with inconsistent pivots.
   * Some have a 0.01 armature and render at centimetres; far more often the
   * exporter normalises the model into a box and it comes back at exactly 2.00
   * or 6.00 m whatever it depicts. Neither number is a statement about the
   * object, so the registry's is used instead — and the registry's is used by
   * everything else already: the scene builder reserves each footprint from it
   * and derives each stop camera from it (D-051, D-062).
   *
   * This used to apply only outside a half-to-double band, on the grounds that
   * a small deviation was the artist's intent. It is not: a normalised export
   * lands inside that band almost every time, and sixteen delivered assets were
   * being drawn at a size the layout did not assume — a 17 m chimney ridge at
   * 10 m, a 9 m ferry at 15, a valley at exactly half (D-120).
   *
   * Scaling is uniform and taken from height, so the model keeps its own
   * proportions. That is safe rather than lucky: every recorded triple is the
   * file's own aspect at the intended height, and after scaling the width and
   * depth land within 3% of what the collider was built from.
   */
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.scale.setScalar(1);
    group.position.setY(0);
    group.updateMatrixWorld(true);

    const size = new Box3().setFromObject(model).getSize(new Vector3());
    const target = asset.entry.dimensions[1];
    if (size.y > 0.0001 && target > 0) group.scale.setScalar(target / size.y);

    group.updateMatrixWorld(true);
    const grounded = new Box3().setFromObject(model);
    if (Number.isFinite(grounded.min.y)) group.position.setY(-grounded.min.y);
  }, [model, asset.entry.dimensions]);

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

interface ModelErrorBoundaryState {
  failed: boolean;
}

/**
 * A failed GLB must degrade to the placeholder rather than blank the canvas.
 * R3F propagates loader errors as render errors, so this needs a class
 * boundary — hooks cannot catch them.
 */
class ModelErrorBoundary extends React.Component<
  { fallback: ReactNode; children: ReactNode; onError: (error: Error) => void },
  ModelErrorBoundaryState
> {
  override state: ModelErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error): void {
    this.props.onError(error);
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface AssetInstanceProps {
  asset: ResolvedAsset;
  emphasis?: boolean;
  /** Off for anything the scene draws in bulk or behind the play area. */
  castShadow?: boolean;
}

export function AssetInstance({ asset, emphasis = false, castShadow = true }: AssetInstanceProps) {
  const [failed, setFailed] = useState(false);
  const placeholder = <PlaceholderAsset asset={asset} emphasis={emphasis} />;

  if (!asset.modelUrl || failed) return placeholder;

  return (
    <ModelErrorBoundary
      fallback={placeholder}
      onError={(error) => {
        console.warn(`[assets] ${asset.entry.id} could not be loaded, using placeholder`, error);
        setFailed(true);
      }}
    >
      {/* The placeholder also covers the loading window, so nothing pops in blank. */}
      <Suspense fallback={placeholder}>
        <Model url={asset.modelUrl} asset={asset} castShadow={castShadow} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

/** Drops a cached GLB when its city is unloaded. */
export function releaseModel(asset: ResolvedAsset): void {
  if (asset.modelUrl) useGLTF.clear(asset.modelUrl);
}
