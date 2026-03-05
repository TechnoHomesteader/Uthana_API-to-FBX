# Implementation Plan (Roadmap 2)

## Objective

Make the toolkit OS-agnostic with explicit Windows support while preserving the existing working
CLI + web functionality.

## Scope

In scope:

1. Cross-platform launch workflow.
2. Cross-platform file reveal behavior.
3. Windows onboarding documentation.
4. Tests for platform-dependent behavior.

Out of scope:

1. New product features unrelated to OS support.
2. Auth persistence redesign.
3. Cloud deployment.

## Work Breakdown

1. Launch command normalization:
   - Add Node-based launcher script in `scripts/` (or equivalent) to avoid shell-specific `open`.
   - Add npm scripts as primary entrypoint for UI start.
   - Keep `make` commands as optional convenience on macOS.
2. Reveal endpoint portability:
   - Keep macOS path: `open -R <file>`.
   - Add Windows path: `explorer /select,<file>`.
   - Return structured unsupported response for other OSes.
3. Frontend compatibility:
   - Keep current button UX.
   - Surface platform-specific reveal messages cleanly in status feed.
4. Documentation updates:
   - Add Windows setup and run sections to README.
   - Add troubleshooting notes for PowerShell and PATH issues.
5. Test plan expansion:
   - Unit tests for platform branch selection.
   - Integration tests for `/api/reveal` across mocked `process.platform` values.
   - Preserve existing tests for shared URL/path helpers.

## Acceptance Criteria

1. UI launch is supported on both macOS and Windows with one documented command path.
2. Reveal works on macOS and Windows; unsupported platforms get a clear non-error response.
3. CLI behavior and exit codes remain unchanged.
4. Existing web flow (characters -> generate -> preview -> download) remains functional.
5. Test suite covers new platform branches and passes.
