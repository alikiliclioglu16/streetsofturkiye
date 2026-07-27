# Technical Architecture

## Recommended stack

Use current stable releases unless the existing repository already establishes a compatible version:

- Next.js with App Router
- React and TypeScript strict mode
- Three.js
- React Three Fiber
- Drei
- Zustand or an equivalent small explicit state store
- Zod or JSON Schema validation at data boundaries
- Vitest for logic tests
- Playwright for critical end-to-end flows
- Vercel deployment

Supabase is a later persistence target; do not make the vertical slice depend on a live backend.

## Suggested application boundaries

```text
src/
  app/
    map/
    city/[cityId]/
    collection/
  components/
    game-ui/
    map/
    three/
  engine/
    assets/
    camera/
    controls/
    interactions/
    progress/
    quality/
    scene/
  content/
    loaders/
    schemas/
  stores/
  styles/
public/
  assets/
    characters/
    shared/
    regions/
    cities/
```

The exact structure may be adjusted, but the boundaries must remain explicit.

## Core modules

### Content loader

- Loads a city definition by ID.
- Validates it at runtime.
- Resolves language fallback.
- Converts content data into engine configuration.

### Asset registry

- Maps logical asset IDs to GLB, texture and audio paths.
- Provides placeholder geometry and visible diagnostics when an asset is missing.
- Supports optional low/medium/high variants.
- Prevents arbitrary asset paths in city components.

### City scene engine

- Creates environment kit, route, hotspots and props from data.
- Does not contain İstanbul-specific copy or transforms.
- Exposes lifecycle events without owning permanent progress.

### Player and guided controller

- Exploration and guided modes share a common movement contract.
- Input adapters: keyboard/mouse, touch and automated route follower.
- Player stays within authored route bounds.

### Interaction state machine

Recommended states:

```text
idle → available → entering → active → success|retry → reward → complete
```

The UI and 3D scene react to this state; neither should independently infer progress.

### Progress repository

Interface example:

```ts
interface ProgressRepository {
  loadProfile(): Promise<PlayerProfile>;
  saveProfile(profile: PlayerProfile): Promise<void>;
  loadCityProgress(cityId: string): Promise<CityProgress | null>;
  saveCityProgress(progress: CityProgress): Promise<void>;
}
```

Implement local storage first. Keep a future Supabase implementation replaceable.

### Quality manager

- selects low/medium/high automatically;
- allows manual override;
- controls DPR, shadows, post-processing, particle density and LOD;
- stores the selected mode.

## Loading strategy

- Map bundle must not eagerly load city GLBs.
- Load city definition first, then critical assets, then optional background assets.
- Display meaningful progress rather than a frozen canvas.
- Preload only the next likely small asset bundle when idle.
- Abort or ignore stale loads when leaving a city.

## Error strategy

- Missing GLB: render a named placeholder and log the logical asset ID.
- Invalid city JSON: show a recoverable error screen and return-to-map action.
- WebGL unavailable: show an explanatory fallback; keep access to static city information where practical.
- Save failure: keep session state and show a non-blocking warning.

## Analytics-ready events

Design event names without requiring analytics in Phase 01:

- `city_entered`
- `intro_skipped`
- `hotspot_started`
- `interaction_completed`
- `interaction_retried`
- `collectible_earned`
- `quiz_answered`
- `city_completed`
- `quality_changed`
- `guided_mode_changed`

Do not send personally identifying child data.
