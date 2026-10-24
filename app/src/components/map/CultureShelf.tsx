'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, useGLTF } from '@react-three/drei';
import {
  Box3,
  Group,
  MathUtils,
  PMREMGenerator,
  Vector3,
  type Object3D,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CULTURE_ICONS, CULTURE_SHELF, type CultureIcon } from '@/engine/icons/registry';
import { t } from '@/content/i18n';
import type { Locale } from '@/content/i18n';

/**
 * The counter at the top of the map.
 *
 * Seven things a child meets in these cities, standing in a row and turning
 * slowly. It is decoration and says so: nothing here is a control, nothing
 * tells the child anything the cities do not, and losing it costs the page
 * nothing but warmth.
 *
 * **Why a shelf rather than icons floating around the title.** Every one of
 * these models was exported standing on something — a cream plinth under the
 * simit, a tray under the cezve, feet under the Karagöz screen. Scattered in
 * the air they read as objects that have had their table taken away, and the
 * only way to float them would be to cut the bottom off models the owner
 * commissioned. A row standing on a line is what the assets already are.
 *
 * **Why one canvas.** Seven canvases would be seven WebGL contexts; browsers
 * keep about sixteen alive and drop the oldest without asking, which on a
 * tablet means the map page quietly evicts the city's context. One context,
 * seven children of one group.
 */

/** A little air at both ends, so nothing touches the edge of the canvas. */
const MARGIN = 1.1;
/** Headroom above the tallest piece: its hover lift, and a little over it. */
const HEADROOM = 0.29;
const SHELF_ASPECT =
  Math.round(((CULTURE_SHELF.width + MARGIN) / (CULTURE_SHELF.height + HEADROOM)) * 100) / 100;

function Environment() {
  const gl = useThree((state) => state.gl);
  /**
   * A generated room, not a downloaded HDR.
   *
   * The çaydanlık and the cezve are metal, and metal with no environment to
   * reflect renders black — the first pass had a steel teapot come out as a
   * faceted lump of coal. `RoomEnvironment` is built in code at load time, so
   * it fixes that for nothing: no file, no request, no licence.
   */
  const texture = useMemo<Texture>(() => {
    const pmrem = new PMREMGenerator(gl);
    const built = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return built;
  }, [gl]);

  useEffect(() => () => texture.dispose(), [texture]);

  // Attached declaratively rather than assigned: r3f detaches it on unmount,
  // and a scene handed back by a hook is not this component's to write to.
  return <primitive object={texture} attach="environment" />;
}

function Piece({
  icon,
  index,
  active,
  reducedMotion,
  onHover,
}: {
  icon: CultureIcon;
  index: number;
  active: boolean;
  reducedMotion: boolean;
  onHover: (id: string | null) => void;
}) {
  const { scene } = useGLTF(icon.url);
  const holder = useRef<Group>(null);
  const spinner = useRef<Group>(null);

  /**
   * One clone per icon, measured and stood on the line.
   *
   * Measured rather than trusted: these came from seven separate exports and
   * arrive at seven different scales, with their origins wherever the exporter
   * left them. The box is taken once, the model is moved so its *base* sits at
   * y = 0 and its centre is over x = 0, and then it is scaled to the height the
   * data asks for. Doing it here rather than in the file keeps the owner's
   * assets untouched.
   */
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    clone.position.set(-centre.x, -box.min.y, -centre.z);
    const wrapper = new Group();
    wrapper.add(clone);
    wrapper.scale.setScalar(icon.height / Math.max(size.y, 0.001));
    return wrapper;
  }, [scene, icon.height]);

  /** Radians turned past `facing` by the hold, kept across frames. */
  const held = useRef(0);

  useFrame((state, delta) => {
    const lift = holder.current;
    const turn = spinner.current;
    if (!lift || !turn) return;

    if (reducedMotion) {
      turn.rotation.y = icon.facing;
      lift.position.y = 0;
      lift.scale.setScalar(active ? 1.08 : 1);
      return;
    }

    /**
     * Sway at rest, one full turn while held.
     *
     * The hold's rotation is accumulated separately and then *unwound* when
     * the child lets go, rather than being snapped back: a piece that jumps to
     * its resting angle the moment the pointer leaves reads as the page
     * correcting a mistake. Unwinding to the nearest whole turn means it
     * always comes to rest facing forward, however far round it got.
     */
    if (active) {
      held.current += delta * Math.PI * 1.1;
    } else if (held.current !== 0) {
      const settle = Math.round(held.current / (Math.PI * 2)) * Math.PI * 2;
      held.current = MathUtils.damp(held.current, settle, 4, delta);
      if (Math.abs(held.current - settle) < 0.002) held.current = 0;
    }

    const phase = (state.clock.elapsedTime / icon.period + index * 0.17) * Math.PI * 2;
    turn.rotation.y = icon.facing + Math.sin(phase) * icon.sway + held.current;

    /**
     * A bob, offset per piece.
     *
     * Same phase across the row and seven objects breathe as one animal, which
     * reads as a bug in the page rather than life in the objects.
     */
    const bob = Math.sin(state.clock.elapsedTime * 0.9 + index * 1.3) * 0.018;
    const target = bob + (active ? 0.17 : 0);
    lift.position.y = MathUtils.damp(lift.position.y, target, 7, delta);
    lift.scale.setScalar(MathUtils.damp(lift.scale.x, active ? 1.1 : 1, 7, delta));
  });

  return (
    <group position={[CULTURE_SHELF.places[index]!.x, 0, 0]}>
      <group ref={holder}>
        <group
          ref={spinner}
          rotation={[0, icon.facing, 0]}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHover(icon.id);
          }}
          onPointerOut={() => onHover(null)}
        >
          <primitive object={model as Object3D} />
        </group>
      </group>
    </group>
  );
}

/**
 * Fits the row to the canvas, with an orthographic camera.
 *
 * **Perspective was wrong here, and the render proved it.** A band this shape
 * is very wide and very short, and a perspective camera fitted to its width
 * ends up almost on top of the row: at 30° and an aspect over six, the
 * horizontal half-angle is nearly sixty degrees, so the pieces at the ends are
 * seen from the side while the middle one is seen head-on. The Karagöz screen
 * showed its edge for that reason and not because its sway was too wide.
 *
 * Orthographic removes the question. Every piece is seen from the same angle
 * whatever its place in the row, which is both what a row of icons wants and
 * what makes the per-piece `facing` angles mean the same thing everywhere.
 */
function FitRow({ children }: { children: React.ReactNode }) {
  const size = useThree((state) => state.size);

  // Pixels per shelf unit: the row, plus a margin, exactly fills the width.
  const zoom = size.width / (CULTURE_SHELF.width + MARGIN);
  /**
   * The shelf line sits a fixed distance above the bottom of the band, so the
   * row keeps its footing whatever the band's height works out to.
   */
  const centre = size.height / zoom / 2 - 0.12;

  return (
    <>
      {/* Declared rather than assigned: a camera handed back by a hook is not
          this component's to write to, and drei rebuilds the projection when
          these props change. */}
      <OrthographicCamera makeDefault zoom={zoom} position={[0, centre, 10]} near={0.1} far={40} />
      {children}
    </>
  );
}

export function CultureShelf({
  locale,
  reducedMotion,
}: {
  locale: Locale;
  reducedMotion: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [visible, setVisible] = useState(
    // A browser with no observer gets the shelf straight away rather than never.
    () => typeof IntersectionObserver === 'undefined',
  );
  const host = useRef<HTMLDivElement>(null);

  /**
   * Nothing is fetched until the shelf is on screen.
   *
   * It is 1.5 MB of decoration on a page whose job is to get a child into a
   * city, and a child who taps straight through to İzmir should never have paid
   * for it. The observer also means a tab opened and left alone never spins up
   * a WebGL context at all.
   */
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /**
   * The name, and where to put it.
   *
   * Centred under the whole band at first, which looked like it was labelling
   * whichever piece happened to stand in the middle: hovering the teapot put
   * the word "Teapot" under the cezve. It belongs under the piece it names.
   *
   * The position is a percentage rather than pixels, because the camera fits
   * the row's width to the band's width — so a piece's share of the band is
   * the same fraction at every screen size, and nothing has to be measured at
   * runtime to work it out.
   */
  const held = CULTURE_SHELF.places.find((place) => place.icon.id === active);
  const label = held?.icon.label;
  const labelLeft = held
    ? `${50 + (held.x / (CULTURE_SHELF.width + MARGIN)) * 100}%`
    : '50%';

  return (
    <div
      ref={host}
      /**
       * Decorative, and marked as such.
       *
       * A screen reader has no use for seven turning objects that lead
       * nowhere, and reading out "Simit, Çay, Çaydanlık…" before the map is
       * noise in front of the thing the page is for.
       */
      aria-hidden="true"
      style={{
        position: 'relative',
        /**
         * The band's shape follows the row's, rather than a guessed height.
         *
         * The camera fits the row's measured width to whatever width the band
         * gets, so a height chosen independently shows up as dead air above
         * the pieces at one screen size and crops them at another. An aspect
         * ratio ties the two together: the row fills the band at every width
         * between a phone and a desktop, and no breakpoint has to be picked.
         *
         * The number is the row's own: its width plus the end margin, over the
         * tallest piece plus the room its hover lift needs.
         */
        aspectRatio: String(SHELF_ASPECT),
        minHeight: 86,
        maxHeight: 182,
        margin: '-6px 0 -2px',
        // The counter top: a warm line the row stands on, fading at both ends.
        background:
          'linear-gradient(180deg, transparent 0%, transparent 62%, rgba(203,184,146,0.22) 62%, transparent 100%)',
        userSelect: 'none',
      }}
    >
      {visible ? (
        <Canvas
          orthographic
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          style={{ pointerEvents: 'auto' }}
        >
          <Environment />
          <hemisphereLight args={['#ffffff', '#CBB892', 1.1]} />
          <directionalLight position={[3, 5, 4]} intensity={1.8} />
          <directionalLight position={[-3, 1.5, 3]} intensity={0.6} />
          <FitRow>
            <Suspense fallback={null}>
              {CULTURE_ICONS.map((icon, index) => (
                <Piece
                  key={icon.id}
                  icon={icon}
                  index={index}
                  active={active === icon.id}
                  reducedMotion={reducedMotion}
                  onHover={setActive}
                />
              ))}
            </Suspense>
          </FitRow>
        </Canvas>
      ) : null}

      {/* The name of whatever is being held, under the row. */}
      <p
        style={{
          position: 'absolute',
          left: labelLeft,
          bottom: -4,
          transform: label ? 'translate(-50%, 0)' : 'translate(-50%, 4px)',
          margin: 0,
          whiteSpace: 'nowrap',
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: 'var(--cini-blue)',
          opacity: label ? 0.9 : 0,
          transition: 'opacity 180ms ease, transform 180ms ease, left 220ms ease',
          pointerEvents: 'none',
        }}
      >
        {label ? t(label, locale) : ' '}
      </p>
    </div>
  );
}
