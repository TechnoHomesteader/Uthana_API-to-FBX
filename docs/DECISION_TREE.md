# Decision Tree

## 1) Start Path

1. Need scriptable automation?
   - Yes -> use CLI (`src/uthana_text2fbx.js`)
   - No -> use web UI (`make ui`)

## 2) Character Selection

1. Can `/api/characters` load characters?
   - Yes -> pick character from dropdown
   - No -> verify API key, then inspect GraphQL schema compatibility in `uthanaClient.js`

## 3) Motion Generation

1. Prompt valid (>5 chars)?
   - No -> fix prompt length
   - Yes -> call `/api/generate`
2. Generate fails?
   - GraphQL error -> validate API key and account permissions
   - Missing motion ID -> inspect response shape and parser assumptions

## 4) Preview and Download

1. Preview link opens?
   - No -> verify `characterId` and `motionId` values
2. Download fails?
   - HTTP failure -> check auth and URL pattern
   - Empty body -> retry and verify remote artifact availability

## 5) Local File Actions

1. File saved?
   - No -> inspect `/api/download` path validation and filesystem permissions
2. Reveal fails?
   - Non-macOS -> expected unsupported behavior
   - macOS error -> verify file is under project `out/` directory

## 6) Troubleshooting Priority

1. Validate input and auth first.
2. Validate GraphQL payloads second.
3. Validate filesystem and OS integration third.
