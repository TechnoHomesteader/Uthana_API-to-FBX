# Handoff Document

## Current State

The project now supports both CLI and local web UI workflows with shared API modules.

- CLI still supports prompt -> motion -> FBX download in one command.
- Web UI provides:
  - API key input (session only)
  - character fetch and selection
  - prompt submission
  - preview-first flow
  - explicit FBX download
  - Finder reveal action on macOS
  - status feed and best-effort account panel

## Runtime Topology

- Node server (`src/web/server.js`) serves static frontend and local API endpoints.
- Frontend (`src/web/public/app.js`) calls local endpoints and maintains in-memory session state.
- Shared Uthana calls are in `src/lib/uthanaClient.js`.
- FBX URL/download logic is in `src/lib/fbx.js`.

## Known Limitations

1. Character and account queries use known query-shape fallbacks; schema changes may require updates.
2. Account usage is best effort and may be unavailable depending on API schema/permissions.
3. Reveal endpoint is only implemented for macOS Finder.
4. No persisted job history or session store.

## Immediate Next Steps

1. Add mocked integration tests for web endpoints.
2. Add structured request logging with redaction for API key fields.
3. Add optional custom output filename input in UI.
4. Add retry/backoff for transient GraphQL and download failures.
