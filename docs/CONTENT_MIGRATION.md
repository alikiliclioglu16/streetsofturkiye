# Content Migration

> **Status: superseded by canonical extraction (D-011, 27 Jul 2026).**
> The migration approach below described converting legacy stops into merged
> city files. That approach is retired. Content is no longer migrated per city
> by the engineer; it is extracted once, deterministically, from the source HTML
> into `content/canonical/`, which is read-only authority.
> See `docs/CANONICAL_MIGRATION_REPORT.md`.

## Current model

| Concern | Location | Editable by |
|---|---|---|
| Educational and cultural content | `content/canonical/` | Nobody. Regenerated from the source HTML with owner approval only. |
| Technical 3D scenes | `content/scenes/` | Engineering, via `npm run content:scenes` or by hand |
| Gameplay instruction copy | `scenes/*.json` → `interaction.gameplayCopy` | Engineering |
| Translations | not yet built; separate locale layer keyed by canonical ids | Editorial |

### Adding a city

1. Canonical content already exists for all 81 provinces — do not author it.
2. Generate a scene: `npm run content:scenes -- <cityId>`.
3. Map its stops to commissioned assets in `scripts/build-scenes.mjs`, or leave
   the graybox stand-ins.
4. Add the city to `PLAYABLE_CITY_IDS`.
5. Run `npm run gate`.

### Rules the validator enforces

- Source SHA must match `content/canonical/manifest.json`.
- 7 regions, 81 cities, 249 stops, 84 questions; 78 cities with one question and
  3 with two.
- Every canonical English string must match the integrity baseline.
- Every scene `contentRef` must resolve.
- No scene file may contain canonical prose.
- `public/content/` must match the sources exactly, with no stale files.

### Legacy art types

The source uses 53 distinct art types across the 81 provinces; they are listed
with usage counts in `content/canonical/taxonomy.json`. They are hints for
briefing 3D assets, not asset ids.
