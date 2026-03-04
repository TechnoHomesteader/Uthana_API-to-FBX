# Uthana Text-to-FBX Downloader (V1 MVP)

Minimal Node.js CLI to:
1. Submit a text prompt to Uthana GraphQL (`create_text_to_motion`)
2. Read the returned `motion.id`
3. Download the FBX file for a provided character ID
4. Save locally

## Requirements

- Node.js 18+
- A valid Uthana API key

## Install / Run

Run directly with Node:

```bash
node ./src/uthana_text2fbx.js \
  --character-id "<character-id>" \
  --prompt "a tired person sits, leans forward, rubs temples, then stands slowly" \
  --api-key "$UTHANA_API_KEY"
```

Or set API key in environment:

```bash
export UTHANA_API_KEY="your_api_key"
node ./src/uthana_text2fbx.js \
  --character-id "<character-id>" \
  --prompt "person sits slowly then stands"
```

If you want the CLI command name:

```bash
npm link
uthana-text2fbx --help
```

## Options

| Option | Description |
| --- | --- |
| `--api-key` | Uthana API key (fallback: `UTHANA_API_KEY`) |
| `--prompt` | Text prompt describing motion |
| `--character-id` | Character skeleton ID |
| `--out` | Output path (default: `./out/<characterId>-<motionId>.fbx`) |
| `--verbose` | Print debug URLs |
| `--help` | Show usage |

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | CLI usage error |
| `2` | GraphQL / API error |
| `3` | FBX download error |

## Notes

- GraphQL endpoint: `https://uthana.com/graphql`
- Auth: `Authorization: Basic base64(API_KEY + ":")`
- FBX URL template:
  `https://uthana.com/motion/file/motion_viewer/<character-id>/<motion-id>/fbx/<character-id>-<motion-id>.fbx`
- Download follows redirects and streams to disk.
