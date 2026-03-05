# Decision Tree

## 1) Start Path

1. Need scriptable automation?
   - Yes -> use CLI (`src/uthana_text2fbx.js`)
   - No -> use web UI (`npm run ui` when added, `make ui` currently on macOS)

## 2) Launch/OS Path

1. Which OS is running?
   - macOS -> current launch/reveal path is supported.
   - Windows -> use roadmap-2 cross-platform launcher and Explorer reveal path.
   - Linux/other -> run headless mode; reveal is non-blocking unsupported response.
2. Browser did not auto-open?
   - Verify launcher mode.
   - Open printed localhost URL manually.

## 3) Character Selection

1. Can `/api/characters` load characters?
   - Yes -> pick character from dropdown
   - No -> verify API key, then inspect GraphQL schema compatibility in `uthanaClient.js`

## 4) Motion Generation

1. Prompt valid (>5 chars)?
   - No -> fix prompt length
   - Yes -> call `/api/generate`
2. Generate fails?
   - GraphQL error -> validate API key and account permissions
   - Missing motion ID -> inspect response shape and parser assumptions

## 5) Preview and Download

1. Preview link opens?
   - No -> verify `characterId` and `motionId` values
2. Download fails?
   - HTTP failure -> check auth and URL pattern
   - Empty body -> retry and verify remote artifact availability

## 6) Local File Actions

1. File saved?
   - No -> inspect `/api/download` path validation and filesystem permissions
2. Reveal fails?
   - macOS error -> verify file is under project `out/` directory and `open` exists
   - Windows error -> verify file is under `out/` and `explorer` invocation path
   - Other OS -> expected unsupported behavior

## 7) Account Usage

1. Usage panel unavailable?
   - Verify API key.
   - Inspect `org`/`subscription` query shapes in `uthanaClient.js`.
   - Confirm fallback parser returns `generated/max/remaining` values.

## 8) Troubleshooting Priority

1. Validate input + auth.
2. Validate GraphQL payload shape.
3. Validate filesystem and OS integration.
