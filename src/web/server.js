#!/usr/bin/env node

import { execFile as execFileCb } from "node:child_process";
import { stat } from "node:fs/promises";
import { promisify } from "node:util";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { downloadMotionFbxToPath, buildPreviewUrl } from "../lib/fbx.js";
import { AppError } from "../lib/errors.js";
import { defaultOutputPath, isPathWithinDirectory, resolveOutputPath } from "../lib/paths.js";
import { createTextToMotion, getAccountUsage, listCharacters } from "../lib/uthanaClient.js";

const execFile = promisify(execFileCb);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const publicDir = path.join(__dirname, "public");
const outputRoot = path.join(projectRoot, "out");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

function requireNonEmptyString(value, message) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(message, { code: "VALIDATION_ERROR", httpStatus: 400, exitCode: 1 });
  }
  return value.trim();
}

function toErrorResponse(error) {
  if (error instanceof AppError) {
    return {
      status: error.httpStatus || 500,
      body: {
        error: {
          code: error.code,
          message: error.message
        }
      }
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: error?.message || "Unexpected error"
      }
    }
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/characters", async (req, res) => {
  try {
    const apiKey = requireNonEmptyString(req.body?.apiKey, "apiKey is required.");
    const verbose = Boolean(req.body?.verbose);
    const characters = await listCharacters({ apiKey, verbose });
    res.json({ characters });
  } catch (error) {
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/account", async (req, res) => {
  try {
    const apiKey = requireNonEmptyString(req.body?.apiKey, "apiKey is required.");
    const verbose = Boolean(req.body?.verbose);
    const account = await getAccountUsage({ apiKey, verbose });
    res.json({ available: true, account });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account information unavailable.";
    res.json({ available: false, message });
  }
});

app.post("/api/generate", async (req, res) => {
  try {
    const apiKey = requireNonEmptyString(req.body?.apiKey, "apiKey is required.");
    const prompt = requireNonEmptyString(req.body?.prompt, "prompt is required.");
    const characterId = requireNonEmptyString(
      req.body?.characterId,
      "characterId is required for preview link."
    );
    const verbose = Boolean(req.body?.verbose);

    if (prompt.length <= 5) {
      throw new AppError("prompt must be longer than 5 characters.", {
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        exitCode: 1
      });
    }

    const motion = await createTextToMotion({ apiKey, prompt, verbose });
    const previewUrl = buildPreviewUrl(characterId, motion.id);

    res.json({ motion, previewUrl });
  } catch (error) {
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/download", async (req, res) => {
  try {
    const apiKey = requireNonEmptyString(req.body?.apiKey, "apiKey is required.");
    const characterId = requireNonEmptyString(req.body?.characterId, "characterId is required.");
    const motionId = requireNonEmptyString(req.body?.motionId, "motionId is required.");
    const requestedOutPath =
      typeof req.body?.outPath === "string" && req.body.outPath.trim() !== ""
        ? req.body.outPath.trim()
        : defaultOutputPath(characterId, motionId);

    const resolvedOutPath = resolveOutputPath(requestedOutPath, characterId, motionId, projectRoot);
    if (!isPathWithinDirectory(resolvedOutPath, projectRoot)) {
      throw new AppError("Output path must be within the project directory.", {
        code: "INVALID_PATH",
        httpStatus: 400,
        exitCode: 1
      });
    }

    const verbose = Boolean(req.body?.verbose);
    await downloadMotionFbxToPath({
      apiKey,
      characterId,
      motionId,
      outPath: resolvedOutPath,
      verbose
    });

    const fileStats = await stat(resolvedOutPath);
    res.json({
      savedPath: resolvedOutPath,
      fileName: path.basename(resolvedOutPath),
      sizeBytes: fileStats.size,
      revealSupported: process.platform === "darwin"
    });
  } catch (error) {
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/reveal", async (req, res) => {
  try {
    const savedPath = requireNonEmptyString(req.body?.savedPath, "savedPath is required.");
    if (!isPathWithinDirectory(savedPath, outputRoot)) {
      throw new AppError("Only files in the out directory can be revealed.", {
        code: "INVALID_PATH",
        httpStatus: 400,
        exitCode: 1
      });
    }

    if (process.platform !== "darwin") {
      res.json({ ok: false, supported: false, message: "Reveal in Finder is only supported on macOS." });
      return;
    }

    await execFile("open", ["-R", savedPath]);
    res.json({ ok: true, supported: true });
  } catch (error) {
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const port = Number(process.env.PORT || 3210);
app.listen(port, "127.0.0.1", () => {
  console.log(`Uthana web UI running at http://127.0.0.1:${port}`);
});
