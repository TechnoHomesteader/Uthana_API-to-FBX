# AGENTS.md

## Purpose

This repository provides two entrypoints over shared Uthana API logic:

1. CLI: `src/uthana_text2fbx.js`
2. Local web UI: `src/web/server.js` + `src/web/public/*`

Agents should preserve parity between CLI and web behavior by updating shared modules in
`src/lib/*` first, then wiring entrypoints.

## Core Principles

1. Keep the CLI functional for automation and agentic workflows.
2. Prefer shared module changes over duplicating API logic.
3. Keep API keys session-scoped in web mode; do not add key persistence.
4. Keep output defaults under `out/` unless explicitly requested.
5. Treat cross-platform support as a core constraint for roadmap-2+ changes.

## Common Commands

```bash
make setup
make ui
make ui-headless
make cli ARGS="--help"
make test
```

## Web API Surface

- `GET /api/health`
- `POST /api/characters`
- `POST /api/account`
- `POST /api/generate`
- `POST /api/download`
- `POST /api/reveal`

## File Ownership Guide

- `src/lib/uthanaClient.js`: GraphQL auth and request/response parsing.
- `src/lib/fbx.js`: preview/download URL building and FBX streaming.
- `src/lib/paths.js`: path defaults and path safety checks.
- `src/web/server.js`: request validation and HTTP contract.
- `src/web/public/*`: user-facing UI and state transitions.
- `src/uthana_text2fbx.js`: CLI argument handling and exit code contract.

## Guardrails

1. Do not commit real API keys, PATs, or downloaded binaries.
2. Preserve CLI exit codes:
   - `1` usage error
   - `2` API/GraphQL error
   - `3` download error
3. Finder reveal endpoint must stay restricted to files under `out/`.
4. Keep account usage panel non-blocking for generation flow.

## Roadmap Notes

1. Roadmap 1 (current) is delivered: working CLI + web UI.
2. Roadmap 2 priority is OS agnostic support:
   - Windows-compatible launch command path
   - platform-aware reveal behavior
   - Windows documentation parity
