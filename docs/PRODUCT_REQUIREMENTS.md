# Product Requirements

## 1. Main map

- Display Türkiye with seven regions and province markers.
- Region-based access replaces a single 81-city linear lock chain.
- Each region may expose a starting province.
- Province cards show name, region, estimated time, progress, collectible count and visual preview.
- Map progress must be readable without relying on color alone.

## 2. City session

Each city is a compact 3–5 minute guided route containing:

- a 10–15 second optional introduction;
- three primary hotspots in the production standard;
- one environmental or object interaction;
- one collectible reward per hotspot;
- one short city quiz;
- one province star or stamp.

The pilot definitions may include extra legacy stops, but the final production template should prioritize three strong interactions over five passive reading stops.

## 3. Control modes

### Exploration mode

- Desktop movement: WASD and arrow keys.
- Camera: mouse/touch drag with safe pitch and yaw limits.
- Mobile movement: virtual joystick or equivalent touch control.
- Interaction: keyboard, pointer and touch.
- Use gentle collision and curated boundaries, not complex simulation.

### Guided mode

- Character follows the route automatically.
- User controls hotspot interactions and decisions.
- Suitable for younger users and accessibility needs.

## 4. Interaction loop

1. User approaches a hotspot.
2. Camera and audio establish the object or place.
3. User completes a 10–30 second interaction.
4. A concise fact card appears.
5. User earns a visible collectible.
6. City quiz recalls something the user did or observed.

## 5. Interaction types for the engine

The first engine must support at least:

- `inspect-and-find`: rotate or inspect an object and select a target detail;
- `sequence-select`: choose correct ingredients or steps in order;
- `rhythm-repeat`: repeat a short visual/audio rhythm;
- `assemble`: place a small number of pieces;
- `observe-and-answer`: locate something in the environment;
- `simple-choice`: accessible fallback interaction.

Phase 01 may implement one complete type and stubs for the others. Phase 02 must implement at least three distinct types.

## 6. Guides

- Nasreddin Hoca and Keloğlan are guide characters, not full dialogue agents.
- Required animation states: idle, walk, wave, point, talk gesture, collect, celebrate.
- Audio and subtitles are independent.
- Lip sync is not required for the vertical slice.

## 7. Progress and rewards

Persist:

- selected profile name;
- visited and completed cities;
- hotspot completion;
- collected artifacts;
- quiz completion;
- selected control, audio and quality settings.

Local storage is acceptable for the vertical slice through a repository adapter. The architecture must allow later Supabase sync.

## 8. Language

- Architecture must support Turkish and English.
- Existing legacy content is primarily English and must be imported without loss.
- Missing localized fields use a documented fallback language.
- Text must not be embedded in 3D textures unless unavoidable.

## 9. Accessibility

- Keyboard operability for major UI flows.
- Visible focus styles.
- Subtitles for spoken lines.
- Reduced-motion support.
- Guided mode.
- Audio categories can be muted separately.
- Do not communicate progress using color alone.

## 10. Out of scope for the first vertical slice

- multiplayer;
- user-generated cities;
- free-form chat with historical characters;
- full physics simulation;
- exact digital twins of cities;
- photorealistic human crowds;
- 81 finished 3D cities;
- mandatory account creation;
- complex lip synchronization.
