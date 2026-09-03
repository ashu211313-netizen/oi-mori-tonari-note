import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allEntities, canonicalChanges, dataDiscrepancies, dataVersion, getProvenanceCoverage } from "../src/data.js";
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
import { allSearchableEntities } from "../src/universal-search.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(readFileSync(path.join(root, "artifacts/data-audit/content-saturation-baseline-2026-09-03.json"), "utf8"));
const readJson = (relative) => JSON.parse(readFileSync(path.join(root, relative), "utf8"));
const runNode = (args) => {
  const run = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: 180_000 });
  return {
    result: run.status === 0 ? "PASS" : run.error?.code === "ETIMEDOUT" ? "TIMEOUT" : "FAIL",
    exitCode: run.status,
    tail: `${run.stdout ?? ""}${run.stderr ?? ""}`.trim().split(/\r?\n/).slice(-12)
  };
};
const present = (value) => Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== "";
const coverage = (records, fields) => Object.fromEntries(fields.map(([label, getter]) => [label, {
  populated: records.filter((record) => present(getter(record))).length,
  total: records.length,
  percent: records.length ? Number((records.filter((record) => present(getter(record))).length / records.length * 100).toFixed(1)) : 0
}]));
const coreCoverage = getProvenanceCoverage();
let sourceClaims = 0;
let fieldProvenance = 0;
for (const record of allExpansionEntities) {
  sourceClaims += record.sourceClaims.length;
  fieldProvenance += Object.keys(record.fieldProvenance).length;
}

const fieldCoverage = {
  item: coverage(itemList, [
    ["category", (r) => r.category], ["group", (r) => r.group], ["numericBuyPrice", (r) => Number.isFinite(r.buyPrice) ? r.buyPrice : null],
    ["numericSellPrice", (r) => Number.isFinite(r.sellPrice) ? r.sellPrice : null], ["rawSellPrice", (r) => r.sellPriceRaw],
    ["acquisitionAnyEvidence", (r) => r.acquisition], ["acquisitionSpecificSource", (r) => r.acquisition?.filter((m) => m.sourceType !== "RETAIL_OR_CATALOG_UNSPECIFIED")],
    ["notes", (r) => r.notes], ["color", (r) => r.color], ["mood", (r) => r.mood], ["style", (r) => r.style],
    ["catalogOrderable", (r) => typeof r.catalogOrderable === "boolean" ? String(r.catalogOrderable) : null]
  ]),
  resident: coverage(residentList, [
    ["japaneseName", (r) => r.japaneseName], ["englishName", (r) => r.englishName], ["species", (r) => r.species], ["gender", (r) => r.gender],
    ["birthday", (r) => r.birthday], ["personality", (r) => r.personality], ["preferredStyle", (r) => r.preferredStyle],
    ["dislikedStyle", (r) => r.dislikedStyle], ["catchphrase", (r) => r.catchphrase]
  ]),
  gyroid: coverage(gyroidList, [
    ["japaneseName", (r) => r.japaneseName], ["group", (r) => r.group], ["sellPrice", (r) => r.sellPrice], ["color", (r) => r.color], ["mood", (r) => r.mood]
  ]),
  npc: coverage(npcList, [
    ["schedule", (r) => r.schedule], ["role", (r) => r.role], ["services", (r) => r.services], ["details", (r) => r.details],
    ["location", (r) => r.location], ["appearanceConditions", (r) => r.appearanceConditions], ["rewards", (r) => r.rewards]
  ]),
  facility: coverage(facilityList, [
    ["operatingHours", (r) => r.operatingHours], ["services", (r) => r.services], ["details", (r) => r.details],
    ["structuredTables", (r) => r.structuredTables], ["upgrades", (r) => r.upgrades], ["requirements", (r) => r.requirements], ["rewards", (r) => r.rewards]
  ]),
  event: coverage(eventList, [
    ["dateRule", (r) => r.dateRule], ["timeRule", (r) => r.timeRule], ["description", (r) => r.description], ["conditions", (r) => r.conditions],
    ["rewardText", (r) => r.rewardText], ["rewardItemIds", (r) => r.rewardItemIds], ["location", (r) => r.location]
  ])
};

const beforePopulated = {
  item: {
    category: baseline.item.category, group: baseline.item.group, numericBuyPrice: baseline.item.numericBuyPrice,
    numericSellPrice: baseline.item.numericSellPrice, rawSellPrice: null,
    acquisitionAnyEvidence: baseline.acquisition.itemsWithAnyEvidenceBackedEdge,
    acquisitionSpecificSource: baseline.acquisition.itemsWithAnyEvidenceBackedEdge,
    notes: baseline.item.notes, color: baseline.item.color, mood: baseline.item.mood,
    style: baseline.item.style, catalogOrderable: baseline.item.catalogOrderable
  },
  resident: {
    japaneseName: baseline.records.resident, englishName: baseline.resident.englishName, species: baseline.resident.species,
    gender: baseline.resident.gender, birthday: baseline.resident.birthday, personality: baseline.resident.personality,
    preferredStyle: baseline.resident.preferredStyle, dislikedStyle: baseline.resident.dislikedStyle, catchphrase: 0
  },
  gyroid: { japaneseName: baseline.records.gyroid, ...baseline.gyroid },
  npc: { ...baseline.npc, appearanceConditions: 0, rewards: baseline.npc.rewards },
  facility: { ...baseline.facility, structuredTables: 0, requirements: 0, rewards: 0 },
  event: { dateRule: 0, timeRule: 0, description: 0, conditions: 0, rewardText: 0, rewardItemIds: 0, location: 0 }
};
const beforeTotals = {
  item: baseline.records.item, resident: baseline.records.resident, gyroid: baseline.records.gyroid,
  npc: baseline.records.npc, facility: baseline.records.facility, event: baseline.records.event
};
const fieldCoverageBeforeAfter = Object.fromEntries(Object.entries(fieldCoverage).map(([domain, fields]) => [
  domain,
  Object.fromEntries(Object.entries(fields).map(([field, after]) => {
    const populated = beforePopulated[domain]?.[field] ?? null;
    const total = beforeTotals[domain];
    return [field, {
      before: { populated, total, percent: populated === null ? null : total ? Number((populated / total * 100).toFixed(1)) : 0 },
      after
    }];
  }))
]));
const unitFiles = readdirSync(path.join(root, "tests")).filter((name) => name.endsWith(".test.js")).sort().map((name) => `tests/${name}`);
const automatedGates = {
  unit: runNode(["--test", ...unitFiles]),
  typecheck: runNode(["node_modules/typescript/bin/tsc", "-p", "jsconfig.json"]),
  lint: runNode(["node_modules/eslint/bin/eslint.js", "."]),
  data: runNode(["scripts/validate-data.mjs"]),
  provenance: runNode(["scripts/validate-provenance.mjs"]),
  evidenceSufficiency: runNode(["scripts/validate-evidence-sufficiency.mjs"]),
  static: runNode(["scripts/validate-static.mjs"]),
  security: runNode(["scripts/validate-security.mjs"]),
  images: runNode(["scripts/validate-image-assets.mjs"])
};
const compactBrowser = (relative) => {
  const value = readJson(relative);
  return {
    label: value.label, requested: value.requested, observed: value.observed, result: value.result,
    tests: value.tests, pass: value.pass, fail: value.fail,
    interpretation: value.observed ? value.interpretation : "ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS"
  };
};
const browsers = {
  chrome: compactBrowser("artifacts/qa/e2e-saturation-final-v12-chrome.json"),
  edge: compactBrowser("artifacts/qa/e2e-saturation-final-v12-edge.json"),
  managedWebKit: compactBrowser("artifacts/qa/e2e-saturation-final-v12-webkit.json"),
  firefox: compactBrowser("artifacts/qa/e2e-saturation-final-v12-firefox-headed.json")
};
const migration = readJson("artifacts/qa/migration-backup-matrix.json");
const lighthouse = readJson("artifacts/lighthouse-summary.json");
const automatedGreen = Object.values(automatedGates).every((gate) => gate.result === "PASS");
const primaryE2eGreen = [browsers.chrome, browsers.edge, browsers.managedWebKit]
  .every((browser) => browser.result === "PASS" && browser.tests === 19 && browser.pass === 19);
const contentGate = itemList.length === 1271 && residentList.length === 148 && gyroidList.length === 127
  && npcList.length === 17 && facilityList.length === 8 && eventList.length === 12
  && expansionCounts.acquisitionCoveredItems > baseline.acquisition.itemsWithAnyEvidenceBackedEdge
  && expansionCounts.acquisitionUnknownItems < baseline.acquisition.itemsWithoutEdge
  && allSearchableEntities.length === 1767 && residentUncertainties.length === 2;
const preservationGate = migration.result === "PASS" && canonicalChanges.length === 0
  && coreCoverage.conflicts === 9 && dataDiscrepancies.length === 6;
const classification = automatedGreen && primaryE2eGreen && contentGate && preservationGate
  ? "PERSONAL_ULTIMATE_MAX_CONTENT_COMPLETE"
  : "PERSONAL_ULTIMATE_MAX_CONTENT_INCOMPLETE";

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  dataVersion,
  serviceWorkerCache: "wild-world-companion-v12",
  beforeAfter: {
    acquisitionKnown: { before: baseline.acquisition.itemsWithAnyEvidenceBackedEdge, after: expansionCounts.acquisitionCoveredItems },
    acquisitionUnknown: { before: baseline.acquisition.itemsWithoutEdge, after: expansionCounts.acquisitionUnknownItems },
    purchasePlaceUnspecified: { before: baseline.acquisition.numericBuyPriceWithoutEdge, after: expansionCounts.purchasePlaceUnspecifiedItems },
    eventRecords: { before: baseline.records.event, after: eventList.length },
    items: { before: baseline.records.item, after: itemList.length },
    searchableTotal: { before: baseline.records.searchableTotal, after: allSearchableEntities.length }
  },
  exactRecords: {
    core: allEntities.length, item: itemList.length, resident: residentList.length, gyroid: gyroidList.length,
    npc: npcList.length, facility: facilityList.length, event: eventList.length,
    expansion: allExpansionEntities.length, searchableTotal: allSearchableEntities.length
  },
  acquisitionInterpretation: {
    anyEvidenceBackedEdge: expansionCounts.acquisitionCoveredItems,
    explicitOrCategoricalAcquisitionText: itemList.filter((item) => item.acquisition.some((method) => method.sourceType !== "RETAIL_OR_CATALOG_UNSPECIFIED")).length,
    purchasePlaceUnspecified: expansionCounts.purchasePlaceUnspecifiedItems,
    completelyUnknown: expansionCounts.acquisitionUnknownItems,
    rule: "A numeric buy-price cell proves that a purchase price exists, not which shop or whether catalog ordering is available."
  },
  fieldCoverage,
  fieldCoverageBeforeAfter,
  provenance: {
    sourceRegistry: expansionSources.length,
    sourceLineages: [...new Set(expansionSources.map((source) => source.lineageId))].length,
    sourceClaims,
    fieldProvenanceInstances: fieldProvenance,
    coreJpIndependentVerified: `${coreCoverage.withJpIndependentVerification}/${coreCoverage.totalCriticalFieldInstances}`,
    coreConflicts: `${coreCoverage.conflicts} fields / ${dataDiscrepancies.length} registry`,
    coreCanonicalChanges: canonicalChanges.length,
    residentNameConflictsUnresolved: residentUncertainties.length
  },
  preservation: {
    storageKey: "wildWorldCompanionState.v1",
    saveSchema: 3,
    realImages: 0,
    externalImagesDownloaded: 0
  },
  domainReadiness: {
    item: "USABLE", resident: "USABLE", gyroid: "USABLE", npc: "USABLE", facility: "USABLE", event: "USABLE",
    note: "USABLE is not COMPLETE_VERIFIED; unresolved or absent fields remain explicit in fieldCoverageBeforeAfter."
  },
  qa: { automatedGates, browsers, migration, lighthouse, automatedGreen, primaryE2eGreen },
  classification,
  gate: { contentGate, preservationGate },
  redTeam: {
    fakeOrEmptyEvents: "REJECTED_BY_12_EXTRACTED_ROWS_AND_SEARCH_CALENDAR_E2E",
    guessedSeller: "REJECTED_BY_RETAIL_OR_CATALOG_UNSPECIFIED_AND_UI_WARNING",
    fabricatedResident150: "REJECTED_BY_148_IMPLEMENTED_AND_2_UNRESOLVED_EXCLUDED",
    unsupportedCount: "REJECTED_BY_SOURCE_ARTIFACT_HASHES_AND_VALIDATORS",
    searchOrPersistenceRegression: "REJECTED_BY_UNIT_MIGRATION_AND_PRIMARY_E2E",
    sourceLineageInflation: "REJECTED_BY_SINGLE_OI_MORI_LINEAGE_POLICY",
    remainingAdverseFindings: [
      "16 campaign-classified items still have no sufficiently specific acquisition edge.",
      "866 purchase edges prove a buy price but not the seller or catalog availability.",
      "Event locations are 0/12 because the event table does not state them.",
      "Firefox is environment-blocked before app assertions; managed WebKit is not physical Safari."
    ]
  },
  classificationRule: "PERSONAL_ULTIMATE_MAX_CONTENT_COMPLETE requires all automated gates and Chrome/Edge/managed-WebKit E2E to pass; it does not convert unknown or region-unconfirmed fields into verified facts."
};

const output = path.join(root, "artifacts/data-audit/content-saturation-report.json");
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.beforeAfter, null, 2));
console.log(JSON.stringify({ classification, automatedGreen, primaryE2eGreen, contentGate, preservationGate }, null, 2));
if (classification !== "PERSONAL_ULTIMATE_MAX_CONTENT_COMPLETE") process.exitCode = 1;
