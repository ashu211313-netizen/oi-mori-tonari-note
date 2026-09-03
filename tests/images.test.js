import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allEntities } from "../src/data.js";
import { imageAssetMap } from "../src/generated/image-assets.js";
import { resolveEntityImage, validateImageRegistrations } from "../src/images.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("every current entity exposes truthful image metadata without invented paths", () => {
  assert.equal(allEntities.length, 184);
  for (const entity of allEntities) {
    assert.ok(entity.image, `missing image metadata: ${entity.id}`);
    assert.ok(["available", "missing"].includes(entity.image.status));
    assert.ok(entity.image.alt.includes(entity.japaneseName));
    if (entity.image.status === "missing") assert.equal(entity.image.localPath, null);
  }
});

test("an audited local asset resolves to an available image record", () => {
  const image = resolveEntityImage(
    { id: "fish-shark", type: "fish", japaneseName: "サメ" },
    {
      "fish-shark": {
        localPath: "./assets/fish/fish-shark.webp",
        alt: "サメのゲーム内画像",
        sourceType: "user_supplied_local",
        notes: "personal-use local asset"
      }
    }
  );
  assert.deepEqual(image, {
    localPath: "./assets/fish/fish-shark.webp",
    alt: "サメのゲーム内画像",
    status: "available",
    sourceType: "user_supplied_local",
    notes: "personal-use local asset"
  });
});

test("image manifest and generated map contain only same-origin local files", () => {
  const manifestPath = path.join(root, "assets", "image-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.schemaVersion, 1);
  assert.ok(Array.isArray(manifest.entries));
  for (const [id, image] of Object.entries(imageAssetMap)) {
    assert.match(id, /^(?:fish|bug|fossil|art|item|resident|npc|gyroid|facility)-[a-z0-9-]+$/);
    assert.match(image.localPath, /^\.\/assets\//);
    assert.equal(/^https?:\/\//.test(image.localPath), false);
    assert.equal(fs.existsSync(path.join(root, image.localPath.replace(/^\.\//, ""))), true);
  }
});

test("image registration audit rejects broken, unmapped, duplicate, and remote entries", () => {
  const known = new Set(["gyroid-001"]);
  const errors = validateImageRegistrations([
    { id: "gyroid-001", localPath: "./assets/gyroids/gyroid-001.webp", fileExists: false },
    { id: "gyroid-001", localPath: "./assets/gyroids/gyroid-001.png", fileExists: true },
    { id: "gyroid-999", localPath: "https://example.test/remote.png", fileExists: true }
  ], known);
  assert.ok(errors.some((error) => /missing or broken/.test(error)));
  assert.ok(errors.some((error) => /duplicate/.test(error)));
  assert.ok(errors.some((error) => /not mapped/.test(error)));
  assert.ok(errors.some((error) => /same-origin/.test(error)));
});
