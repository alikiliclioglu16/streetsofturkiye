# Content Migration

## Source

`legacy/index.html` contains the original city arrays `CITIES1` and `CITIES2`. The package includes extracted versions so the production application does not need to execute or scrape the HTML at runtime.

## Included datasets

- `content/legacy/cities.raw.json`: direct structural extraction.
- `content/legacy/cities.normalized.json`: typed-friendly normalized representation.
- `content/regions.json`: seven region definitions.
- `content/pilot/*.json`: new 3D experience specifications for the three-city vertical slice.

## Migration principles

1. Preserve the original wording and choices during extraction.
2. Do not treat extraction as factual verification.
3. Add Turkish localization through explicit fields, not by replacing English.
4. Replace emoji rewards with logical collectible IDs while retaining legacy references for traceability.
5. Keep `legacyArt` only as a migration hint. It must not dictate the final 3D asset.
6. Record editorial status per fact or city before nationwide publication.

## Legacy-to-new mapping

| Legacy element | New element |
|---|---|
| city object | `CityDefinition` |
| stop array | hotspot definition |
| SVG art key | asset concept hint |
| stop text sheet | post-interaction fact card |
| emoji reward | 3D/2D collectible asset |
| quiz array | typed quiz with explicit correct IDs |
| sequential city unlock | region-based progression rule |
| local state object | progress repository |

## Scripts

- `scripts/extract-legacy-content.mjs` can repeat the extraction if the original HTML changes.
- `scripts/validate-content.mjs` performs basic schema-shape checks without requiring the final application.

The application should use its own runtime schema validation rather than relying only on these scripts.
