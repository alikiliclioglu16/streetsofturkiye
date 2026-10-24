import type { LocalizedText } from '@/content/schemas/canonical';

/**
 * The seven things on the counter — a registry, not a component.
 *
 * It lives under `engine/` because of CLAUDE.md rule 4 and the lint rule that
 * enforces it: a component never names a file. These are not city assets, so
 * they do not belong in `engine/assets/registry.ts` with the checksums and the
 * delivery status — nothing in a city ever resolves one, and putting them
 * there would subject page decoration to the asset budget tests. Their own
 * small registry is the honest place.
 *
 * Data rather than JSX, for the same reason every other list in this project
 * is: a component that holds seven hand-placed transforms is a component that
 * has to be edited to add an eighth. The numbers here are per-model because the
 * models disagree with each other — a çay glass is 19 cm and a Karagöz screen
 * is most of a metre, and normalising them all to the same box would stand a
 * tea glass as tall as a puppet theatre.
 *
 * `height` is what the object should measure on the shelf, in the shelf's own
 * units. It is a judgement about how a child reads the row, not a measurement
 * of the real thing: the simit is nudged up because a ring seen edge-on reads
 * smaller than it is, and the Karagöz screen is held down because at its true
 * relative size it dwarfs everything beside it.
 *
 * No city is claimed for any of them. Several have an obvious home — baklava
 * and Gaziantep, Karagöz and Bursa — but the canonical content does not say so,
 * and inventing that link here would put content in a component (CLAUDE.md
 * rule 3) and content nobody wrote into a child's hands.
 */
export interface CultureIcon {
  readonly id: string;
  readonly url: string;
  readonly label: LocalizedText;
  /** Target height on the shelf. */
  readonly height: number;
  /**
   * Where it faces at rest, in radians.
   *
   * Measured one model at a time off a render, because the seven exports do
   * not agree on which way is front. Most of them turned out to want about a
   * third of a radian; the two that are pictures rather than objects want
   * whatever puts their picture towards the child.
   */
  readonly facing: number;
  /**
   * How far it sways either side of `facing`, in radians, and how long a full
   * sway takes in seconds.
   *
   * Sway rather than spin, and the first pass got this wrong. A slow turn
   * looks right on a teapot and is wrong on everything flat: the simit is a
   * ring, the baklava is a tray stood on its edge and the Karagöz screen is a
   * picture with a plain wooden back, so a rotation shows each of them as a
   * sliver for half of every turn. The screenshot that proved it had caught
   * the baklava exactly edge-on.
   *
   * Swaying keeps every piece facing the child and still reads as alive. The
   * full turn is kept for the moment a child holds one — that is where showing
   * off the back of an object belongs.
   */
  readonly sway: number;
  readonly period: number;
  /**
   * How wide the piece is for its height, measured off the file.
   *
   * The row was laid out on an even pitch at first, which spaces the *centres*
   * evenly and therefore spaces the objects unevenly: the cezve tray is twice
   * as wide as it is tall and the ice cream is a third as wide, so one pair
   * touched while another had a hole between them. Spacing from the measured
   * width puts an equal *gap* between neighbours, which is what a row of
   * objects on a counter actually looks like.
   */
  readonly aspect: number;
}

export const CULTURE_ICONS: readonly CultureIcon[] = [
  {
    id: 'simit',
    url: '/assets/icons/simit.glb',
    label: { tr: 'Simit', en: 'Simit' },
    height: 0.98,
    facing: 0.42,
    /** A ring. Narrow sway, or it spends half its time as a line. */
    sway: 0.34,
    period: 7,
    aspect: 0.988,
  },
  {
    id: 'cay',
    url: '/assets/icons/cay.glb',
    label: { tr: 'Çay', en: 'Tea' },
    height: 0.82,
    facing: 0.3,
    sway: 0.7,
    period: 6.2,
    aspect: 1.183,
  },
  {
    id: 'caydanlik',
    url: '/assets/icons/caydanlik.glb',
    label: { tr: 'Çaydanlık', en: 'Teapot' },
    height: 1,
    facing: 0.55,
    /** Round from every side, so it can afford the widest sway of the seven. */
    sway: 0.78,
    period: 8,
    aspect: 1.038,
  },
  {
    id: 'kahve',
    url: '/assets/icons/kahve.glb',
    label: { tr: 'Türk Kahvesi', en: 'Turkish coffee' },
    height: 0.72,
    facing: 0.48,
    sway: 0.52,
    period: 6.8,
    aspect: 2.077,
  },
  {
    id: 'baklava',
    url: '/assets/icons/baklava.glb',
    label: { tr: 'Baklava', en: 'Baklava' },
    height: 0.86,
    facing: 0.45,
    /** A tray stood on its edge: it is only baklava from the front. */
    sway: 0.26,
    period: 7.6,
    aspect: 1.087,
  },
  {
    id: 'dondurma',
    url: '/assets/icons/dondurma.glb',
    label: { tr: 'Dondurma', en: 'Ice cream' },
    height: 1.02,
    facing: 0.25,
    sway: 0.72,
    period: 5.8,
    aspect: 0.398,
  },
  {
    id: 'karagoz',
    url: '/assets/icons/karagoz.glb',
    label: { tr: 'Karagöz ve Hacivat', en: 'Karagöz and Hacivat' },
    height: 1.06,
    facing: 0.4,
    /**
     * The narrowest sway and the slowest of the seven.
     *
     * It is a picture with a plain wooden back, so it is the piece that can
     * afford to move least — a shadow-play screen seen from behind is a box.
     */
    sway: 0.16,
    period: 9,
    aspect: 1.001,
  },
];

/** Every file the shelf will fetch, for the preload hint and for tests. */
export const CULTURE_ICON_URLS = CULTURE_ICONS.map((icon) => icon.url);

/**
 * Where each piece stands, and how wide the whole row is.
 *
 * Laid out once from the measured widths: every neighbour gets the same gap,
 * and the row is centred on zero. Derived here rather than in the component so
 * the component holds no numbers at all.
 */
const GAP = 0.34;

export const CULTURE_SHELF = (() => {
  const widths = CULTURE_ICONS.map((icon) => icon.aspect * icon.height);
  const span = widths.reduce((sum, width) => sum + width, 0) + GAP * (widths.length - 1);
  let cursor = -span / 2;
  const places = CULTURE_ICONS.map((icon, index) => {
    const width = widths[index]!;
    const x = cursor + width / 2;
    cursor += width + GAP;
    return { icon, x };
  });
  /** Tallest piece, so the camera can be fitted to the row rather than guessed. */
  const height = Math.max(...CULTURE_ICONS.map((icon) => icon.height));
  return { places, width: span, height };
})();
