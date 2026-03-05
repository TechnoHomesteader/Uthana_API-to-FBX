# Handoff Document

## Snapshot

Roadmap 1 is effectively complete. The repository now ships a working CLI and a working local web
UI backed by shared modules.

Completed in Roadmap 1:

1. CLI flow from prompt -> motion generation -> FBX download.
2. Local web flow with prompt entry, generation, preview link, download, and status feed.
3. Character selection and account usage support against the current Uthana schema.
4. Shared API/download modules used by both CLI and web.
5. Basic tests, docs, and launch commands.

## Runtime Topology

1. `src/web/server.js` exposes local API routes and serves static UI.
2. `src/web/public/app.js` manages in-browser flow and status feed.
3. `src/lib/uthanaClient.js` handles GraphQL auth + query fallbacks.
4. `src/lib/fbx.js` builds preview/download URLs and streams FBX files.
5. `src/uthana_text2fbx.js` remains the automation-first CLI entrypoint.

## Known Limitations (Current)

1. Launch workflow is still Make/macOS-oriented (`make ui`, `open` command).
2. Reveal action currently targets Finder behavior only.
3. Account usage depends on fallback query shapes and may need updates if API changes.
4. No persisted history/session state.

## Roadmap 2 (Next)

Primary objective: make the toolkit OS-agnostic, with first-class Windows support.

1. Cross-platform launch UX:
   - Replace or supplement Make-based launch with Node/npm launcher commands that work on macOS and Windows.
   - Keep one obvious command to start UI, with optional auto-open browser behavior.
2. Cross-platform file reveal:
   - Support macOS Finder (`open -R`) and Windows Explorer (`explorer /select,`), with graceful fallback.
3. Cross-platform docs and onboarding:
   - Add explicit macOS + Windows quickstarts.
   - Document shell differences and environment variable setup on PowerShell.
4. Stabilize web smoke/integration coverage:
   - Add endpoint-level tests for `/api/characters`, `/api/account`, `/api/generate`, `/api/download`, `/api/reveal`.
5. Keep CLI parity:
   - Any shared-module change must preserve CLI behavior and exit code contract.

## Suggested First Tasks for Next Session

1. Add `npm run ui` and `npm run ui:no-open` scripts using a Node-based launcher (not shell-specific).
2. Implement platform-aware `reveal` branch in server for `darwin` and `win32`.
3. Add `README` sections: Windows setup + launch.
4. Add integration tests with mocked GraphQL and mocked filesystem/child-process calls.
