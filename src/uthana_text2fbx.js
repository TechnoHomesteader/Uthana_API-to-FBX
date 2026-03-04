#!/usr/bin/env node

import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const GRAPHQL_ENDPOINT = "https://uthana.com/graphql";
const TEXT_TO_MOTION_MUTATION = `
  mutation textToMotion($prompt: String!) {
    create_text_to_motion(prompt: $prompt) {
      motion {
        id
        name
      }
    }
  }
`;

class CliError extends Error {
  constructor(message, exitCode) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}

function getUsage() {
  return `uthana-text2fbx

Usage:
  uthana-text2fbx --character-id <id> --prompt "<text>" [options]

Options:
  --api-key <key>        Uthana API key (or use UTHANA_API_KEY)
  --prompt <text>        Text prompt describing the motion
  --character-id <id>    Character skeleton ID
  --out <path>           Output path for FBX (default: ./out/<characterId>-<motionId>.fbx)
  --verbose              Print debug details
  --help                 Show this message

Exit codes:
  0 Success
  1 CLI usage error
  2 GraphQL / API error
  3 FBX download error`;
}

function parseArgs(argv) {
  const options = {
    verbose: false,
    help: false
  };

  const optionMap = {
    "--api-key": "apiKey",
    "--prompt": "prompt",
    "--character-id": "characterId",
    "--out": "outPath"
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--verbose") {
      options.verbose = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    const mapped = optionMap[arg];
    if (!mapped) {
      throw new CliError(`Unknown option: ${arg}\n\n${getUsage()}`, 1);
    }

    const value = argv[i + 1];
    if (value === undefined) {
      throw new CliError(`Missing value for ${arg}\n\n${getUsage()}`, 1);
    }

    options[mapped] = value;
    i += 1;
  }

  return options;
}

function toAuthHeader(apiKey) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)}${units[unitIndex]}`;
}

function buildDownloadUrl(characterId, motionId) {
  return `https://uthana.com/motion/file/motion_viewer/${encodeURIComponent(characterId)}/${encodeURIComponent(motionId)}/fbx/${encodeURIComponent(characterId)}-${encodeURIComponent(motionId)}.fbx`;
}

async function createMotion({ apiKey, prompt, verbose }) {
  if (verbose) {
    console.log(`GraphQL URL: ${GRAPHQL_ENDPOINT}`);
  }

  let response;
  try {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: toAuthHeader(apiKey)
      },
      body: JSON.stringify({
        query: TEXT_TO_MOTION_MUTATION,
        variables: { prompt }
      })
    });
  } catch (error) {
    throw new CliError(`Failed to reach GraphQL endpoint: ${error.message}`, 2);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new CliError(
      `GraphQL request failed with HTTP ${response.status}. ${body.slice(0, 300)}`.trim(),
      2
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new CliError(`GraphQL response was not valid JSON: ${error.message}`, 2);
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const message = payload.errors
      .map((entry) => entry.message || JSON.stringify(entry))
      .join("; ");
    throw new CliError(`GraphQL error: ${message}`, 2);
  }

  const motionId = payload?.data?.create_text_to_motion?.motion?.id;
  if (!motionId) {
    throw new CliError("GraphQL response missing data.create_text_to_motion.motion.id", 2);
  }

  return motionId;
}

async function downloadMotionFbx({ apiKey, downloadUrl, outPath, verbose }) {
  if (verbose) {
    console.log(`Download URL: ${downloadUrl}`);
  }

  let response;
  try {
    response = await fetch(downloadUrl, {
      method: "GET",
      headers: {
        Authorization: toAuthHeader(apiKey)
      },
      redirect: "follow"
    });
  } catch (error) {
    throw new CliError(`Failed to download FBX: ${error.message}`, 3);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new CliError(
      `FBX download failed with HTTP ${response.status}. ${body.slice(0, 300)}`.trim(),
      3
    );
  }

  if (!response.body) {
    throw new CliError("FBX download returned an empty response body", 3);
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(outPath));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(getUsage());
    return;
  }

  const apiKey = options.apiKey || process.env.UTHANA_API_KEY;
  const prompt = options.prompt?.trim();
  const characterId = options.characterId?.trim();

  if (!apiKey) {
    throw new CliError("Missing API key. Use --api-key or UTHANA_API_KEY.", 1);
  }
  if (!prompt || prompt.length <= 5) {
    throw new CliError("Prompt must be longer than 5 characters.", 1);
  }
  if (!characterId) {
    throw new CliError("Missing --character-id.", 1);
  }

  console.log(`Prompt: "${prompt}"`);
  const motionId = await createMotion({ apiKey, prompt, verbose: options.verbose });
  console.log(`Motion ID: ${motionId}`);

  const outPath = options.outPath || path.join("out", `${characterId}-${motionId}.fbx`);
  const downloadUrl = buildDownloadUrl(characterId, motionId);

  console.log("Downloading FBX...");
  await downloadMotionFbx({
    apiKey,
    downloadUrl,
    outPath,
    verbose: options.verbose
  });

  const fileStats = await stat(outPath);
  console.log(`Saved to ${outPath}`);
  console.log(`File size: ${formatSize(fileStats.size)}`);
}

main().catch((error) => {
  if (error instanceof CliError) {
    console.error(`Error: ${error.message}`);
    process.exit(error.exitCode);
  }

  console.error(`Unexpected error: ${error?.message || String(error)}`);
  process.exit(2);
});
