import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { AppError } from "./errors.js";

function toAuthHeader(apiKey) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

export function buildMotionViewerFbxUrl(characterId, motionId) {
  return `https://uthana.com/motion/file/motion_viewer/${encodeURIComponent(characterId)}/${encodeURIComponent(motionId)}/fbx/${encodeURIComponent(characterId)}-${encodeURIComponent(motionId)}.fbx`;
}

export function buildPreviewUrl(characterId, motionId) {
  return `https://uthana.com/app/play/${encodeURIComponent(characterId)}/${encodeURIComponent(motionId)}`;
}

export async function downloadMotionFbxToPath({
  apiKey,
  characterId,
  motionId,
  outPath,
  verbose = false
}) {
  const downloadUrl = buildMotionViewerFbxUrl(characterId, motionId);
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
    throw new AppError(`Failed to download FBX: ${error.message}`, {
      code: "DOWNLOAD_FAILED",
      httpStatus: 502,
      exitCode: 3
    });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AppError(
      `FBX download failed with HTTP ${response.status}. ${body.slice(0, 300)}`.trim(),
      {
        code: "DOWNLOAD_FAILED",
        httpStatus: response.status,
        exitCode: 3
      }
    );
  }

  if (!response.body) {
    throw new AppError("FBX download returned an empty response body", {
      code: "DOWNLOAD_EMPTY",
      httpStatus: 502,
      exitCode: 3
    });
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(outPath));

  return {
    outPath,
    downloadUrl
  };
}
