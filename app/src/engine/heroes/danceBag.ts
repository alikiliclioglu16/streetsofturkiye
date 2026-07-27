/**
 * Non-repeating shuffle bag for celebration dances.
 *
 * A plain random pick repeats often enough that a child notices. The bag hands
 * out every clip once before refilling, and a refill never starts with the clip
 * that just played, so the same dance cannot appear twice in a row.
 */

export interface ShuffleBag {
  readonly pool: readonly string[];
  readonly remaining: readonly string[];
  readonly lastDrawn: string | null;
}

export function createShuffleBag(pool: readonly string[]): ShuffleBag {
  return { pool: [...pool], remaining: [], lastDrawn: null };
}

/** Deterministic shuffle so a seeded run can be tested. */
function shuffle(items: readonly string[], seed: number): string[] {
  const result = [...items];
  let hash = seed >>> 0;
  for (let i = result.length - 1; i > 0; i -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    const a = result[i];
    const b = result[j];
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }
  return result;
}

export interface DrawResult {
  readonly bag: ShuffleBag;
  readonly clip: string | null;
}

export function draw(bag: ShuffleBag, seed: number = Math.floor(Math.random() * 0xffffffff)): DrawResult {
  if (bag.pool.length === 0) return { bag, clip: null };

  let remaining = bag.remaining;
  if (remaining.length === 0) {
    remaining = shuffle(bag.pool, seed);
    // Refilling must not put the previous clip first, or it would repeat.
    if (bag.pool.length > 1 && remaining[0] === bag.lastDrawn) {
      const [first, ...rest] = remaining;
      remaining = [...rest, first!];
    }
  }

  const [clip, ...rest] = remaining;
  if (clip === undefined) return { bag, clip: null };
  return { bag: { pool: bag.pool, remaining: rest, lastDrawn: clip }, clip };
}
