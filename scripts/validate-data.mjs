import {
  allEntities,
  artList,
  bugList,
  dataDiscrepancies,
  fishList,
  fossilList,
  getProvenanceCoverage,
  sourceClaims,
  sources
} from "../src/data.js";
import {
  allExpansionEntities,
  eventList,
  expansionCounts,
  expansionSources,
  facilityList,
  gyroidList,
  itemList,
  npcList,
  residentList,
  residentUncertainties
} from "../src/expansion-data.js";
import { validateAcquisitionRecords } from "../src/acquisition.js";

const errors = [];
const sourceIds = new Set(sources.map((source) => source.id));
const claimIds = new Set(sourceClaims.map((claim) => claim.id));
const entityIds = new Set();
const weatherValues = new Set(["any", "rain", "snow", "rain_or_snow", "not_rain_or_snow"]);
const conditionCodes = new Set([
  "tree_shake", "white_flower", "spoiled_turnip", "dig_at_sound", "snowball_present",
  "infested_resident", "rock_hit", "trash_source"
]);

function fail(message) {
  errors.push(message);
}

function validTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return Boolean(match && Number(match[1]) <= 23 && Number(match[2]) <= 59);
}

for (const [label, actual, expected] of [
  ["fish", fishList.length, 56],
  ["bugs", bugList.length, 56],
  ["fossils", fossilList.length, 52],
  ["art", artList.length, 20]
]) {
  if (actual !== expected) fail(`${label} count: expected ${expected}, received ${actual}`);
}

for (const entity of allEntities) {
  if (entityIds.has(entity.id)) fail(`duplicate entity id: ${entity.id}`);
  entityIds.add(entity.id);
  if (!entity.japaneseName) fail(`missing Japanese name: ${entity.id}`);
  if (!Number.isFinite(entity.sellPrice) || entity.sellPrice < 0 || entity.sellPrice > 20000) {
    fail(`invalid sell price: ${entity.id}`);
  }
  for (const reference of entity.sourceReferences ?? []) {
    if (!sourceIds.has(reference.sourceId)) fail(`unknown source ${reference.sourceId}: ${entity.id}`);
  }
  for (const record of Object.values(entity.fieldProvenance ?? {})) {
    for (const sourceId of record.sourceIds) {
      if (!sourceIds.has(sourceId)) fail(`provenance source does not resolve: ${sourceId}`);
    }
    for (const claimId of record.sourceClaimIds) {
      if (!claimIds.has(claimId)) fail(`provenance claim does not resolve: ${claimId}`);
    }
  }
  for (const rule of entity.availabilityRules ?? []) {
    if (rule.startMonth < 1 || rule.startMonth > 12 || rule.endMonth < 1 || rule.endMonth > 12) {
      fail(`invalid month: ${entity.id}`);
    }
    if (rule.startDay < 1 || rule.startDay > 31 || rule.endDay < 1 || rule.endDay > 31) {
      fail(`invalid day: ${entity.id}`);
    }
    if (!validTime(rule.startTime) || !validTime(rule.endTime)) fail(`invalid time: ${entity.id}`);
    if (!weatherValues.has(rule.weather)) fail(`invalid weather: ${entity.id}`);
    if (rule.conditionCode && !conditionCodes.has(rule.conditionCode)) fail(`invalid conditionCode: ${entity.id}`);
    if (!rule.location) fail(`missing location: ${entity.id}`);
  }
}

for (const discrepancy of dataDiscrepancies) {
  if (!entityIds.has(discrepancy.entityId)) fail(`discrepancy entity does not resolve: ${discrepancy.id}`);
  for (const sourceId of [discrepancy.sourceAId, discrepancy.sourceBId]) {
    if (!sourceIds.has(sourceId)) fail(`discrepancy source does not resolve: ${discrepancy.id}/${sourceId}`);
  }
  for (const claimId of discrepancy.sourceClaimIds) {
    if (!claimIds.has(claimId)) fail(`discrepancy claim does not resolve: ${discrepancy.id}/${claimId}`);
  }
}

const expansionSourceIds = new Set(expansionSources.map((source) => source.id));
const expansionEntityIds = new Set(allExpansionEntities.map((entity) => entity.id));
for (const [label, actual, expected] of [
  ["NPC", npcList.length, 17], ["facilities", facilityList.length, 8], ["gyroids", gyroidList.length, 127],
  ["residents", residentList.length, 148], ["items", itemList.length, 1271], ["events", eventList.length, 12]
]) {
  if (actual !== expected) fail(`${label} expansion count: expected ${expected}, received ${actual}`);
}
if (residentUncertainties.length !== 2) fail(`resident uncertainties: expected 2, received ${residentUncertainties.length}`);
if (allExpansionEntities.length !== expansionEntityIds.size) fail("duplicate expansion entity id");
if ([...expansionEntityIds].some((id) => entityIds.has(id))) fail("core and expansion ids overlap");

for (const source of expansionSources) {
  if (!(["JP", "GLOBAL_WW"].includes(source.region))) fail(`unsupported expansion source region: ${source.id}`);
  if (source.region === "JP" && source.language !== "ja") fail(`JP expansion source has non-Japanese language: ${source.id}`);
  if (!source.lineageId || !source.independenceGroup) fail(`missing source lineage: ${source.id}`);
}

for (const entity of allExpansionEntities) {
  if (!new RegExp(`^${entity.type}-[a-z0-9-]+$`).test(entity.id)) fail(`unstable expansion id: ${entity.id}`);
  if (!entity.japaneseName) fail(`missing expansion Japanese name: ${entity.id}`);
  if (!entity.image || entity.image.status !== "missing" || entity.image.localPath !== null) fail(`invalid expansion image metadata: ${entity.id}`);
  if (!entity.sourceClaims?.length) fail(`missing expansion source claim: ${entity.id}`);
  if (!Object.keys(entity.fieldProvenance ?? {}).length) fail(`missing expansion provenance: ${entity.id}`);
  for (const reference of entity.sourceReferences ?? []) {
    if (!expansionSourceIds.has(reference.sourceId)) fail(`unknown expansion source ${reference.sourceId}: ${entity.id}`);
  }
  for (const record of Object.values(entity.fieldProvenance ?? {})) {
    if (!record.sourceIds?.length) fail(`empty field provenance source: ${entity.id}`);
    for (const sourceId of record.sourceIds ?? []) {
      if (!expansionSourceIds.has(sourceId)) fail(`unresolved expansion provenance source ${sourceId}: ${entity.id}`);
    }
  }
  for (const discrepancy of entity.dataDiscrepancies ?? []) {
    if (!discrepancy.id || !discrepancy.field || !discrepancy.sourceAId || !discrepancy.sourceBId) {
      fail(`incomplete expansion discrepancy: ${entity.id}`);
      continue;
    }
    if (!expansionSourceIds.has(discrepancy.sourceAId) || !expansionSourceIds.has(discrepancy.sourceBId)) {
      fail(`unresolved expansion discrepancy source: ${entity.id}/${discrepancy.id}`);
    }
    const fieldRecord = entity.fieldProvenance?.[discrepancy.field];
    if (fieldRecord?.status !== "CONFLICT" || !fieldRecord.discrepancyIds?.includes(discrepancy.id)) {
      fail(`expansion discrepancy not surfaced as CONFLICT: ${entity.id}/${discrepancy.id}`);
    }
  }
  for (const value of [entity.buyPrice, entity.sellPrice]) {
    if (value !== null && value !== undefined && (!Number.isFinite(value) || value < 0)) fail(`invalid expansion price: ${entity.id}`);
  }
}
errors.push(...validateAcquisitionRecords(itemList, expansionEntityIds));
if (expansionCounts.acquisitionCoveredItems !== itemList.length || expansionCounts.acquisitionUnknownItems !== 0) {
  fail(`final acquisition coverage mismatch: ${expansionCounts.acquisitionCoveredItems}/${itemList.length}; unknown ${expansionCounts.acquisitionUnknownItems}`);
}

const report = {
  counts: {
    fish: fishList.length, bugs: bugList.length, fossils: fossilList.length, art: artList.length,
    expansion: expansionCounts
  },
  discrepancies: dataDiscrepancies.length,
  provenance: getProvenanceCoverage(),
  errors
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
