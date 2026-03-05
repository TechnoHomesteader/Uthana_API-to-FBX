# Implementation Plan

## Objective

Deliver a local-first web interface while preserving and sharing logic with the existing CLI.

## Work Breakdown

1. Shared module extraction:
   - Move GraphQL and download logic into `src/lib/*`.
   - Keep CLI entrypoint thin and stable.
2. Web server:
   - Add Express server with local API endpoints.
   - Add request validation and error mapping.
3. Frontend:
   - Build minimal single-page UI for prompt->preview->download flow.
   - Add status feed and account panel.
4. Tooling:
   - Add `Makefile` commands for setup/run/test.
   - Add npm scripts for CLI/web/test.
5. Documentation:
   - Update README.
   - Add AGENTS/handoff/decision-tree docs.
6. Validation:
   - Add unit tests for path and URL helpers.
   - Manual smoke test for UI and CLI parity.

## Acceptance Criteria

1. `make ui` starts server and auto-opens browser.
2. User can fetch characters, generate motion, preview, and download FBX.
3. User can reveal downloaded file in Finder (macOS).
4. Existing CLI command format and exit codes remain valid.
5. `make test` runs successfully.
