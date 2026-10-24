import { describe, expect, it } from 'vitest';
import { statSync } from 'node:fs';
import path from 'node:path';

import { CULTURE_ICONS, CULTURE_ICON_URLS, CULTURE_SHELF } from '@/engine/icons/registry';

/**
 * The counter on the map page.
 *
 * It is decoration, which is exactly why it needs guarding: nothing on screen
 * breaks when one of these files goes missing or quietly triples in size, so
 * nothing would ever say so. The page it sits on is the first thing a child
 * loads and the last place that should be carrying a surprise.
 */

const publicDir = path.resolve(process.cwd(), 'public');

/**
 * A ceiling, not a target.
 *
 * The seven arrived as 202 MB of Meshy export — 2048-pixel colour, 2048
 * normals and 4096 metallic-roughness maps for objects drawn about 120 pixels
 * wide. They sit at 1.5 MB now. Half a megabyte for any single piece of
 * decoration is already generous, and the whole row has to stay inside what
 * the city routes themselves cost per visit.
 */
const PER_ICON_BYTES = 512 * 1024;
const TOTAL_BYTES = 1.8 * 1024 * 1024;

describe('the icons on the counter', () => {
  it('all exist where the registry says they do', () => {
    for (const url of CULTURE_ICON_URLS) {
      const file = path.join(publicDir, url);
      expect(() => statSync(file), url).not.toThrow();
    }
  });

  it('stays inside the budget, per piece and altogether', () => {
    let total = 0;
    for (const url of CULTURE_ICON_URLS) {
      const bytes = statSync(path.join(publicDir, url)).size;
      total += bytes;
      expect(bytes, `${url} is ${(bytes / 1024).toFixed(0)} KB`).toBeLessThanOrEqual(PER_ICON_BYTES);
    }
    expect(total, `${(total / 1024).toFixed(0)} KB in all`).toBeLessThanOrEqual(TOTAL_BYTES);
  });

  it('names every piece in both languages', () => {
    for (const icon of CULTURE_ICONS) {
      expect(icon.label.tr.trim().length, icon.id).toBeGreaterThan(0);
      expect(icon.label.en.trim().length, icon.id).toBeGreaterThan(0);
    }
  });

  /**
   * Flat pieces may not sway far.
   *
   * The simit is a ring, the baklava is a tray stood on its edge and the
   * Karagöz screen is a picture with a plain wooden back. A wide sway turns
   * each of them side-on for part of every cycle, which is how the first pass
   * came out — a screenshot caught the baklava as a sliver. Anything whose
   * depth is well under its width has to stay nearly square to the child.
   */
  it('keeps the flat pieces facing forward', () => {
    const flat = ['simit', 'baklava', 'karagoz'];
    for (const id of flat) {
      const icon = CULTURE_ICONS.find((entry) => entry.id === id);
      expect(icon, id).toBeDefined();
      expect(icon!.sway, `${id} sways ${icon!.sway} rad`).toBeLessThanOrEqual(0.35);
    }
  });
});

describe('the row they stand in', () => {
  it('leaves an equal gap between neighbours and never overlaps', () => {
    const edges = CULTURE_SHELF.places.map(({ icon, x }) => {
      const halfWidth = (icon.aspect * icon.height) / 2;
      return { id: icon.id, left: x - halfWidth, right: x + halfWidth };
    });

    const gaps: number[] = [];
    for (let index = 1; index < edges.length; index += 1) {
      const gap = edges[index]!.left - edges[index - 1]!.right;
      expect(gap, `${edges[index - 1]!.id} and ${edges[index]!.id} overlap`).toBeGreaterThan(0);
      gaps.push(gap);
    }
    // Every gap the same, to within floating point.
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0]!, 6);
  });

  it('is centred on zero, so the camera needs no offset', () => {
    const left = CULTURE_SHELF.places[0]!;
    const right = CULTURE_SHELF.places[CULTURE_SHELF.places.length - 1]!;
    const leftEdge = left.x - (left.icon.aspect * left.icon.height) / 2;
    const rightEdge = right.x + (right.icon.aspect * right.icon.height) / 2;
    expect(leftEdge).toBeCloseTo(-rightEdge, 6);
    expect(CULTURE_SHELF.width).toBeCloseTo(rightEdge - leftEdge, 6);
  });

  it('reports the tallest piece, which is what the band is sized from', () => {
    const tallest = Math.max(...CULTURE_ICONS.map((icon) => icon.height));
    expect(CULTURE_SHELF.height).toBe(tallest);
  });
});
