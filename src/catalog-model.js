import { facilityList, gyroidList, itemList, npcList, residentList } from "./expansion-data.js";

const domains = ["item", "resident", "gyroid", "npc", "facility"];
const recordsByDomain = { item: itemList, resident: residentList, gyroid: gyroidList, npc: npcList, facility: facilityList };

export const catalogDomainDefinitions = Object.freeze(Object.fromEntries(domains.map((domain) => [
  domain,
  Object.freeze({
    type: domain,
    collectionStateKey: `${domain}Collection`,
    records: recordsByDomain[domain]
  })
])));

/**
 * Creates a provenance-ready shell only. It intentionally supplies no game facts.
 * @param {{ id: string, type: string, japaneseName: string, englishName?: string }} input
 */
export function createCatalogRecord(input) {
  if (!domains.includes(input.type)) throw new Error(`unsupported catalog domain: ${input.type}`);
  if (!new RegExp(`^${input.type}-[a-z0-9-]+$`).test(input.id)) {
    throw new Error(`unstable catalog id: ${input.id}`);
  }
  if (!input.japaneseName?.trim()) throw new Error("japaneseName is required");
  return {
    id: input.id,
    type: input.type,
    japaneseName: input.japaneseName,
    englishName: input.englishName ?? "",
    image: {
      localPath: null,
      alt: `${input.japaneseName}の画像`,
      status: "missing",
      sourceType: "none",
      notes: "ローカル画像は未登録です。"
    },
    verification: {
      status: "UNVERIFIED",
      region: "JP",
      confidence: 0
    },
    sourceClaims: [],
    fieldProvenance: {}
  };
}

/** @param {ReturnType<typeof createCatalogRecord>} record */
export function validateCatalogRecord(record) {
  const errors = [];
  if (!domains.includes(record.type)) errors.push("unsupported type");
  if (!new RegExp(`^${record.type}-[a-z0-9-]+$`).test(record.id)) errors.push("unstable id");
  if (!record.japaneseName?.trim()) errors.push("missing Japanese name");
  if (!record.verification || record.verification.region !== "JP") errors.push("missing JP verification shell");
  if (!Array.isArray(record.sourceClaims)) errors.push("sourceClaims must be an array");
  if (!record.fieldProvenance || Array.isArray(record.fieldProvenance)) errors.push("fieldProvenance must be an object");
  return errors;
}
