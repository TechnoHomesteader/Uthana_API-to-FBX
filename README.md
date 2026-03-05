# Uthana Text-to-FBX Toolkit

## Summary Overview

This project started as a single CLI command for text-to-motion generation, and now includes a
local web console for a friendlier workflow. You can type a motion prompt, generate a motion ID,
open a browser preview on Uthana, and download the final FBX locally. The CLI remains fully usable
for scripts and agentic workflows, while the web UI provides a guided interface for day-to-day use.

The app is intentionally local-first: no database, no queueing layer, and no cloud deployment
requirements. You launch it from your terminal, interact through `http://127.0.0.1:<port>`, and
save FBX files directly into this repository's `out/` directory by default.

## Features

- CLI generation and FBX download (`uthana-text2fbx`)
- Local web UI with:
  - API key entry (session-only)
  - Character list fetch and selection
  - Prompt submission and motion generation
  - Preview link to Uthana (`/app/play/<character>/<motion>`)
  - Explicit FBX download step
  - Finder reveal button (macOS)
  - Status feed
- Best-effort account usage panel (non-blocking)

## Requirements

- macOS (for Finder reveal + auto-open browser command)
- Node.js 18+ (tested with Node `v24.14.0`)
- GNU Make
- Valid Uthana API key

## Quickstart

```bash
cd /Users/jmetz2/Documents/Uthana_API-to-FBX
make setup
make ui
```

This opens the web UI automatically at `http://127.0.0.1:3210`.

If you do not want auto-open:

```bash
make ui-headless
```

## CLI Usage

```bash
source "$HOME/.nvm/nvm.sh"
node ./src/uthana_text2fbx.js \
  --api-key "$UTHANA_API_KEY" \
  --character-id "<character-id>" \
  --prompt "a tired person sits, leans forward, rubs temples, then stands slowly" \
  --out "./out/motion.fbx"
```

Options:

| Option | Description |
| --- | --- |
| `--api-key` | Uthana API key (fallback: `UTHANA_API_KEY`) |
| `--prompt` | Text prompt describing motion |
| `--character-id` | Character skeleton ID |
| `--out` | Output path (default: `./out/<characterId>-<motionId>.fbx`) |
| `--verbose` | Print debug URLs |
| `--help` | Show usage |

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | CLI usage error |
| `2` | GraphQL / API error |
| `3` | FBX download error |

## Make Commands

| Command | Purpose |
| --- | --- |
| `make setup` | Install npm dependencies with the configured nvm Node version |
| `make ui` | Start web server and auto-open browser |
| `make ui-headless` | Start web server without opening browser |
| `make cli ARGS="..."` | Run CLI with arguments |
| `make test` | Run unit tests |

## API Notes

- GraphQL endpoint: `https://uthana.com/graphql`
- Authentication: `Authorization: Basic base64(API_KEY + ":")`
- FBX URL pattern:
  `https://uthana.com/motion/file/motion_viewer/<character-id>/<motion-id>/fbx/<character-id>-<motion-id>.fbx`

## Project Layout

```text
uthana-text2fbx/
  README.md
  Makefile
  AGENTS.md
  docs/
    HANDOFF.md
    IMPLEMENTATION_PLAN.md
    DECISION_TREE.md
  src/
    uthana_text2fbx.js
    lib/
      errors.js
      fbx.js
      paths.js
      uthanaClient.js
    web/
      server.js
      public/
        index.html
        app.js
        styles.css
  test/
    fbx.test.js
    paths.test.js
  out/
```
