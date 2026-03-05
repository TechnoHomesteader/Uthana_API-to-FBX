import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { defaultOutputPath, isPathWithinDirectory, resolveOutputPath } from "../src/lib/paths.js";

test("defaultOutputPath builds expected filename", () => {
  assert.equal(defaultOutputPath("char1", "motion2"), path.join("out", "char1-motion2.fbx"));
});

test("resolveOutputPath resolves relative output under cwd", () => {
  const cwd = "/tmp/workspace";
  assert.equal(
    resolveOutputPath("out/motion.fbx", "char1", "motion2", cwd),
    path.join(cwd, "out", "motion.fbx")
  );
});

test("isPathWithinDirectory returns true for file inside directory", () => {
  const dir = "/tmp/workspace/out";
  const file = "/tmp/workspace/out/a.fbx";
  assert.equal(isPathWithinDirectory(file, dir), true);
});

test("isPathWithinDirectory returns false for traversal path", () => {
  const dir = "/tmp/workspace/out";
  const file = "/tmp/workspace/other/a.fbx";
  assert.equal(isPathWithinDirectory(file, dir), false);
});
