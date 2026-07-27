# Phase 00 — Audit

## Goal

Establish a safe implementation baseline without modifying the legacy source.

## Tasks

- Inspect package structure and legacy HTML behavior.
- Confirm the normalized dataset contains 81 cities.
- Confirm pilot JSON files validate against the city schema or document necessary schema refinements.
- Decide the new app location and record the decision.
- Create an implementation status file.
- Identify any incompatible assumptions in the specification.
- Record dependency and build commands.

## Acceptance

- No source package file is overwritten.
- `docs/IMPLEMENTATION_STATUS.md` exists.
- The next step is executable without unanswered architectural ambiguity.
