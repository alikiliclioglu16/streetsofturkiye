# QA and Acceptance

## Global quality gate

Before any phase is reported complete:

- lint passes;
- TypeScript typecheck passes;
- automated tests pass;
- production build passes;
- no unhandled console errors in the main flow;
- missing assets display documented fallbacks;
- desktop and touch flows are tested;
- keyboard navigation is tested for primary UI;
- reduced-motion behavior is tested;
- saved progress survives reload;
- leaving and re-entering a city does not duplicate rewards;
- invalid content produces a recoverable error.

## Phase 01 acceptance

- New application exists outside the legacy HTML.
- İstanbul loads from `content/pilot/istanbul.json` or an equivalent validated copy.
- Scene uses placeholder assets through the same registry interface as future GLBs.
- User can enter the city, move, reach a hotspot, complete one interaction, collect one reward, answer a quiz and return to the map.
- Guided mode completes the same route without manual movement.
- Mobile controls are functional.
- Refresh resumes progress.
- Development performance overlay exists.
- Production build succeeds.

## Phase 02 acceptance

- İstanbul, Nevşehir and Gaziantep run through the same engine.
- At least three distinct interaction types are complete.
- Both guides are integrated with required base animations or documented temporary animation fallbacks.
- Ambient, UI and guide audio channels can be controlled separately.
- Each city has a recognizable environment identity.
- Missing individual assets do not break a city.
- Low, medium and high quality modes visibly change cost.
- Performance is measured on at least one representative mobile viewport and one desktop viewport.
- All pilot collectibles appear in the collection screen.

## Art QA

For each final Meshy asset:

- silhouette matches brief;
- no generated text or watermark;
- no unintended symbols;
- back and underside are complete where visible;
- scale and pivot are correct;
- materials read correctly;
- file size and triangle count are recorded;
- historical hero asset has visual-reference approval.
