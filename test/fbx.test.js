import test from "node:test";
import assert from "node:assert/strict";
import { buildMotionViewerFbxUrl, buildPreviewUrl } from "../src/lib/fbx.js";

test("buildMotionViewerFbxUrl builds motion_viewer URL", () => {
  const url = buildMotionViewerFbxUrl("abc123", "xyz456");
  assert.equal(
    url,
    "https://uthana.com/motion/file/motion_viewer/abc123/xyz456/fbx/abc123-xyz456.fbx"
  );
});

test("buildPreviewUrl builds app preview URL", () => {
  const url = buildPreviewUrl("abc123", "xyz456");
  assert.equal(url, "https://uthana.com/app/play/abc123/xyz456");
});
