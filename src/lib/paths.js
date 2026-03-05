import path from "node:path";

const KB = 1024;

export function formatSize(bytes) {
  if (bytes < KB) {
    return `${bytes}B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / KB;
  let unitIndex = 0;
  while (value >= KB && unitIndex < units.length - 1) {
    value /= KB;
    unitIndex += 1;
  }

  return `${value.toFixed(1)}${units[unitIndex]}`;
}

export function defaultOutputPath(characterId, motionId, outDir = "out") {
  return path.join(outDir, `${characterId}-${motionId}.fbx`);
}

export function resolveOutputPath(outPath, characterId, motionId, cwd = process.cwd()) {
  const relativePath = outPath || defaultOutputPath(characterId, motionId);
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  return path.resolve(cwd, relativePath);
}

export function isPathWithinDirectory(filePath, directoryPath) {
  const resolvedFilePath = path.resolve(filePath);
  const resolvedDirectoryPath = path.resolve(directoryPath);
  const relative = path.relative(resolvedDirectoryPath, resolvedFilePath);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`));
}
