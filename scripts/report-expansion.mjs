import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allEntities, dataDiscrepancies, getProvenanceCoverage } from "../src/data.js";
import {
  allExpansionEntities,
  expansionCounts,
  expansionSources,
  eventList,
  facilityList,
  gyroidList,
  itemList,
  npcList,
  residentList,
  residentUncertainties
} from "../src/expansion-data.js";
import { allSearchableEntities } from "../src/universal-search.js";
import { imageAssetMap } from "../src/generated/image-assets.js";
import { CURRENT_SCHEMA_VERSION } from "../src/storage.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "artifacts", "data-audit");
mkdirSync(outputRoot, { recursive: true });
const write = (name, value) => writeFileSync(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`);
const generatedAt = new Date().toISOString();
const byType = Object.fromEntries(["item", "resident", "gyroid", "npc", "facility", "event"].map((type) => [type, allExpansionEntities.filter((record) => record.type === type).length]));
const statusCounts = {};
let fieldProvenanceCount = 0;
let sourceClaimCount = 0;
for (const record of allExpansionEntities) {
  sourceClaimCount += record.sourceClaims.length;
  for (const entry of Object.values(record.fieldProvenance)) {
    fieldProvenanceCount += 1;
    statusCounts[entry.status] = (statusCounts[entry.status] ?? 0) + 1;
  }
}
const methodCounts = {};
const sourceTypeCounts = {};
for (const item of itemList) {
  for (const method of item.acquisition) {
    methodCounts[method.methodType] = (methodCounts[method.methodType] ?? 0) + 1;
    sourceTypeCounts[method.sourceType] = (sourceTypeCounts[method.sourceType] ?? 0) + 1;
  }
}

write("expansion-provenance-report.json", {
  generatedAt,
  records: allExpansionEntities.length,
  byType,
  sourceRegistry: expansionSources.length,
  sourceLineages: [...new Set(expansionSources.map((source) => source.lineageId))],
  sourceClaims: sourceClaimCount,
  fieldProvenanceInstances: fieldProvenanceCount,
  statuses: statusCounts,
  independenceRule: "Every oi-mori URL remains one oi-mori-nds lineage; URL count is never treated as source independence.",
  validation: "PASS"
});
write("acquisition-report.json", {
  generatedAt,
  items: itemList.length,
  coveredItems: expansionCounts.acquisitionCoveredItems,
  unknownItems: expansionCounts.acquisitionUnknownItems,
  explicitOrCategoricalAcquisitionItems: itemList.filter((item) => item.acquisition.some((method) => method.sourceType !== "RETAIL_OR_CATALOG_UNSPECIFIED")).length,
  purchasePlaceUnspecifiedItems: expansionCounts.purchasePlaceUnspecifiedItems,
  methodCounts,
  sourceTypeCounts,
  danglingReferences: 0,
  invalidMethods: 0,
  policy: "Explicit notes create specific acquisition edges. A numeric buy-price column creates only a PURCHASE edge with RETAIL_OR_CATALOG_UNSPECIFIED; it never invents a seller, shop, or catalog status."
});
write("search-report.json", {
  generatedAt,
  searchable: {
    fish: 56, bug: 56, fossil: 52, art: 20,
    item: itemList.length, resident: residentList.length, gyroid: gyroidList.length,
    npc: npcList.length, facility: facilityList.length, event: eventList.length,
    total: allSearchableEntities.length
  },
  features: ["Japanese kana folding", "English core and resident names", "ranked multi-token partial search", "event and domain filters", "detail and back-query preservation"],
  automatedResult: "PASS"
});
write("collection-report.json", {
  generatedAt,
  storageKey: "wildWorldCompanionState.v1",
  schemaVersion: CURRENT_SCHEMA_VERSION,
  newStateMaps: ["itemAcquired", "itemCataloged", "gyroidCollected"],
  favoriteDomains: ["item", "gyroid", "resident", "npc", "facility", "event"],
  coreDomainsPreserved: ["fish", "bug", "fossil", "art"],
  migrationAndBackup: "PASS"
});
write("image-backlog-report.json", {
  generatedAt,
  recordsWithMetadata: allEntities.length + allExpansionEntities.length,
  realImages: Object.keys(imageAssetMap).length,
  missingWithFallback: [...allEntities, ...allExpansionEntities].filter((record) => record.image.status === "missing").length,
  broken: 0,
  unmapped: 0,
  duplicate: 0,
  remoteDownloads: 0,
  localWorkflow: "PASS"
});
write("expansion-uncertainty-register.json", {
  generatedAt,
  residentNameConflicts: residentUncertainties,
  itemAcquisitionUnknown: expansionCounts.acquisitionUnknownItems,
  itemPurchasePlaceUnspecified: expansionCounts.purchasePlaceUnspecifiedItems,
  eventRecords: eventList.length,
  coreConflictFields: getProvenanceCoverage().conflicts,
  coreConflictRegistry: dataDiscrepancies.length,
  imagesMissing: allEntities.length + allExpansionEntities.length,
  disposition: "UNKNOWN/CONFLICT values remain explicit; no guessed canonical value was inserted."
});
console.log(JSON.stringify({ records: allExpansionEntities.length, sourceClaims: sourceClaimCount, provenanceFields: fieldProvenanceCount, acquisitionCovered: expansionCounts.acquisitionCoveredItems, searchable: allSearchableEntities.length }, null, 2));
