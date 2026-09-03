import { imageAssetMap } from "./generated/image-assets.js";

/**
 * Resolve local image metadata without pretending a missing asset exists.
 * @param {{ id: string, type: string, japaneseName: string }} entity
 * @param {Record<string, { localPath: string, alt?: string, sourceType?: string, notes?: string }>} assets
 */
export function resolveEntityImage(entity, assets = imageAssetMap) {
  const asset = assets[entity.id];
  if (!asset) {
    return {
      localPath: null,
      alt: `${entity.japaneseName}の画像`,
      status: "missing",
      sourceType: "none",
      notes: "ローカル画像は未登録です。"
    };
  }
  return {
    localPath: asset.localPath,
    alt: asset.alt || `${entity.japaneseName}の画像`,
    status: "available",
    sourceType: asset.sourceType || "user_supplied_local",
    notes: asset.notes || "ローカル画像フォルダから登録。"
  };
}

/**
 * Pure registration audit used by the build validator and regression tests.
 * @param {{ id: string, localPath: string, fileExists: boolean }[]} registrations
 * @param {Set<string>} knownEntityIds
 */
export function validateImageRegistrations(registrations, knownEntityIds) {
  const errors = [];
  const seen = new Set();
  for (const registration of registrations) {
    if (seen.has(registration.id)) errors.push(`${registration.id}: duplicate image registration`);
    seen.add(registration.id);
    if (!knownEntityIds.has(registration.id)) errors.push(`${registration.id}: image is not mapped to a known record`);
    if (!registration.fileExists) errors.push(`${registration.id}: local image file is missing or broken`);
    if (!/^\.\/assets\//.test(registration.localPath) || /^https?:\/\//.test(registration.localPath)) {
      errors.push(`${registration.id}: image path must be same-origin under ./assets/`);
    }
  }
  return errors;
}
