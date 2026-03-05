#!/usr/bin/env node

import { stat } from "node:fs/promises";
import { downloadMotionFbxToPath } from "./lib/fbx.js";
import { AppError } from "./lib/errors.js";
import { defaultOutputPath, formatSize, resolveOutputPath } from "./lib/paths.js";
import { createTextToMotion } from "./lib/uthanaClient.js";

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

function usageError(message) {
  return new AppError(`${message}\n\n${getUsage()}`, {
    code: "USAGE_ERROR",
    httpStatus: 400,
    exitCode: 1
  });
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

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

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
      throw usageError(`Unknown option: ${arg}`);
    }

    const value = argv[index + 1];
    if (value === undefined) {
      throw usageError(`Missing value for ${arg}`);
    }

    options[mapped] = value;
    index += 1;
  }

  return options;
}

function validateInput({ apiKey, prompt, characterId }) {
  if (!apiKey) {
    throw new AppError("Missing API key. Use --api-key or UTHANA_API_KEY.", {
      code: "USAGE_ERROR",
      httpStatus: 400,
      exitCode: 1
    });
  }

  if (!prompt || prompt.length <= 5) {
    throw new AppError("Prompt must be longer than 5 characters.", {
      code: "USAGE_ERROR",
      httpStatus: 400,
      exitCode: 1
    });
  }

  if (!characterId) {
    throw new AppError("Missing --character-id.", {
      code: "USAGE_ERROR",
      httpStatus: 400,
      exitCode: 1
    });
  }
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
  validateInput({ apiKey, prompt, characterId });

  console.log(`Prompt: "${prompt}"`);
  const motion = await createTextToMotion({
    apiKey,
    prompt,
    verbose: options.verbose
  });
  console.log(`Motion ID: ${motion.id}`);

  const defaultOut = defaultOutputPath(characterId, motion.id);
  const displayOutPath = options.outPath || defaultOut;
  const resolvedOutPath = resolveOutputPath(options.outPath, characterId, motion.id);

  console.log("Downloading FBX...");
  await downloadMotionFbxToPath({
    apiKey,
    characterId,
    motionId: motion.id,
    outPath: resolvedOutPath,
    verbose: options.verbose
  });

  const fileStats = await stat(resolvedOutPath);
  console.log(`Saved to ${displayOutPath}`);
  console.log(`File size: ${formatSize(fileStats.size)}`);
}

main().catch((error) => {
  if (error instanceof AppError) {
    console.error(`Error: ${error.message}`);
    process.exit(error.exitCode);
  }

  console.error(`Unexpected error: ${error?.message || String(error)}`);
  process.exit(2);
});
