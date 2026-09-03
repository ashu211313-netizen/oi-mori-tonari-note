import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allEntities } from "../src/data.js";
import { allExpansionEntities } from "../src/expansion-data.js";
import { imageAssetMap } from "../src/generated/image-assets.js";
import { validateImageRegistrations } from "../src/images.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(path.join(root, "assets", "image-manifest.json"), "utf8"));
const errors = [];
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)) errors.push("invalid image manifest schema");
for (const [id, image] of Object.entries(imageAssetMap)) {
  if (!/^(?:fish|bug|fossil|art|item|resident|npc|gyroid|facility)-[a-z0-9-]+$/.test(id)) errors.push(`${id}: invalid stable id`);
  if (!/^\.\/assets\//.test(image.localPath) || /^https?:\/\//.test(image.localPath)) errors.push(`${id}: image is not local`);
  if (!existsSync(path.join(root, image.localPath.replace(/^\.\//, "")))) errors.push(`${id}: missing file`);
}
const everyEntity = [...allEntities, ...allExpansionEntities];
errors.push(...validateImageRegistrations(
  Object.entries(imageAssetMap).map(([id, image]) => ({
    id,
    localPath: image.localPath,
    fileExists: existsSync(path.join(root, image.localPath.replace(/^\.\//, "")))
  })),
  new Set(everyEntity.map((entity) => entity.id))
));
for (const entity of everyEntity) {
  if (!entity.image) errors.push(`${entity.id}: missing image metadata`);
  if (entity.image?.status === "missing" && entity.image.localPath !== null) errors.push(`${entity.id}: missing image has a path`);
}
console.log(JSON.stringify({
  valid: errors.length === 0,
  currentEntities: everyEntity.length,
  coreEntities: allEntities.length,
  expansionEntities: allExpansionEntities.length,
  availableImages: Object.keys(imageAssetMap).length,
  missingImages: everyEntity.filter((entity) => entity.image.status === "missing").length,
  errors
}, null, 2));
if (errors.length) process.exitCode = 1;
