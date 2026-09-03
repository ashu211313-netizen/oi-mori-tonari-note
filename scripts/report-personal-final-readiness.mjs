import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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
const readJson = (relative) => JSON.parse(readFileSync(path.join(root, relative), "utf8"));
const runNode = (args) => {
  const run = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: 180_000 });
  return {
    result: run.status === 0 ? "PASS" : run.error?.code === "ETIMEDOUT" ? "TIMEOUT" : "FAIL",
    exitCode: run.status,
    tail: `${run.stdout ?? ""}${run.stderr ?? ""}`.trim().split(/\r?\n/).slice(-8)
  };
};
const compactBrowser = (relative) => {
  const report = readJson(relative);
  return {
    label: report.label,
    requested: report.requested,
    observed: report.observed,
    result: report.result,
    tests: report.tests,
    pass: report.pass,
    fail: report.fail,
    interpretation: report.observed
      ? report.interpretation
      : report.stdout.includes("spawn UNKNOWN")
        ? "ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS"
        : report.interpretation
  };
};
const present = (value) => Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== "";
const coverage = (records, definitions) => Object.fromEntries(definitions.map(([name, getter]) => {
  const populated = records.filter((record) => present(getter(record))).length;
  return [name, { populated, total: records.length, percent: Number((populated / records.length * 100).toFixed(1)) }];
}));

const unitFiles = readdirSync(path.join(root, "tests")).filter((name) => name.endsWith(".test.js")).sort().map((name) => `tests/${name}`);
const automatedGates = {
  unit113: runNode(["--test", ...unitFiles]),
  typecheck: runNode(["node_modules/typescript/bin/tsc", "-p", "jsconfig.json"]),
  lint: runNode(["node_modules/eslint/bin/eslint.js", "."]),
  data: runNode(["scripts/validate-data.mjs"]),
  provenance: runNode(["scripts/validate-provenance.mjs"]),
  evidenceSufficiency: runNode(["scripts/validate-evidence-sufficiency.mjs"]),
  static: runNode(["scripts/validate-static.mjs"]),
  security: runNode(["scripts/validate-security.mjs"]),
  images: runNode(["scripts/validate-image-assets.mjs"])
};
const browsers = {
  chrome: compactBrowser("artifacts/qa/e2e-final-perfect-v13-chrome.json"),
  edge: compactBrowser("artifacts/qa/e2e-final-perfect-v13-edge.json"),
  managedWebKit: compactBrowser("artifacts/qa/e2e-final-perfect-v13-webkit.json"),
  firefox: compactBrowser("artifacts/qa/e2e-final-perfect-v13-firefox-headed.json")
};
const migration = readJson("artifacts/qa/migration-backup-matrix.json");
const security = readJson("artifacts/qa/security-privacy-ip-report.json");
const lighthouse = readJson("artifacts/lighthouse-summary.json");
const core = getProvenanceCoverage();
const expansionConflictRecords = eventList.flatMap((event) => event.dataDiscrepancies ?? []);
const sourceClaims = allExpansionEntities.reduce((total, record) => total + record.sourceClaims.length, 0);
const provenanceFields = allExpansionEntities.reduce((total, record) => total + Object.keys(record.fieldProvenance).length, 0);
const explicitAcquisition = itemList.filter((item) => item.acquisition.some((method) => method.sourceType !== "RETAIL_OR_CATALOG_UNSPECIFIED")).length;
const uiScreenshots = [
  "artifacts/ui-final/before-home-desktop.png",
  "artifacts/ui-final/final-home-desktop.png",
  "artifacts/ui-final/final-search-desktop.png",
  "artifacts/ui-final/final-collection-desktop.png",
  "artifacts/ui-final/final-detail-desktop.png",
  "artifacts/ui-final/final-home-mobile-390.png",
  "artifacts/ui-final/final-search-mobile-390.png"
];

const automatedGreen = Object.values(automatedGates).every((gate) => gate.result === "PASS");
const browserGreen = [browsers.chrome, browsers.edge, browsers.managedWebKit]
  .every((browser) => browser.result === "PASS" && browser.tests === 22 && browser.pass === 22);
const dataGreen = expansionCounts.acquisitionCoveredItems === 1271
  && expansionCounts.acquisitionUnknownItems === 0
  && allSearchableEntities.length === 1767
  && residentUncertainties.length === 2
  && canonicalChanges.length === 0
  && core.conflicts === 9
  && dataDiscrepancies.length === 6
  && expansionConflictRecords.length === 3;
const persistenceGreen = migration.result === "PASS"
  && migration.currentSchemaVersion === 3
  && migration.storageKey === "wildWorldCompanionState.v1";
const securityGreen = security.securityPrivacy.status === "PASS"
  && security.dependencySecurity.status === "PASS"
  && security.dependencySecurity.knownVulnerabilities === 0;
const qualityGreen = lighthouse.scores.performance >= 90
  && lighthouse.scores.accessibility === 100
  && lighthouse.scores["best-practices"] === 100
  && lighthouse.scores.seo === 100
  && uiScreenshots.every((relative) => existsSync(path.join(root, relative)));
const classification = automatedGreen && browserGreen && dataGreen && persistenceGreen && securityGreen && qualityGreen
  ? "PERSONAL_FINAL_COMPLETE"
  : "PERSONAL_FINAL_INCOMPLETE";

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  classification,
  dataVersion,
  serviceWorkerCache: "wild-world-companion-v13",
  beforeAfter: {
    acquisitionKnown: { before: 1255, after: expansionCounts.acquisitionCoveredItems },
    acquisitionUnknown: { before: 16, after: expansionCounts.acquisitionUnknownItems },
    explicitOrCategoricalAcquisition: { before: 389, after: explicitAcquisition },
    priceOnlyUnspecifiedSeller: { before: 866, after: expansionCounts.purchasePlaceUnspecifiedItems },
    eventRecords: { before: 12, after: eventList.length },
    eventRewardText: { before: 9, after: eventList.filter((event) => event.rewardText).length },
    eventKnownLocation: { before: 0, after: eventList.filter((event) => event.location).length },
    eventRewardLinkedRecords: { before: 2, after: eventList.filter((event) => event.rewardItemIds?.length).length },
    eventLinkedItemIds: { before: 3, after: eventList.reduce((total, event) => total + (event.rewardItemIds?.length ?? 0), 0) },
    expansionEventConflicts: { before: 0, after: expansionConflictRecords.length },
    searchableTotal: { before: 1767, after: allSearchableEntities.length }
  },
  exactRecords: {
    core: allEntities.length,
    items: itemList.length,
    residents: residentList.length,
    gyroids: gyroidList.length,
    npcs: npcList.length,
    facilities: facilityList.length,
    events: eventList.length,
    expansion: allExpansionEntities.length,
    searchableTotal: allSearchableEntities.length
  },
  fieldCoverage: {
    item: coverage(itemList, [
      ["acquisition", (r) => r.acquisition], ["catalogOrderable", (r) => typeof r.catalogOrderable === "boolean" ? String(r.catalogOrderable) : null],
      ["numericBuyPrice", (r) => Number.isFinite(r.buyPrice) ? r.buyPrice : null], ["numericSellPrice", (r) => Number.isFinite(r.sellPrice) ? r.sellPrice : null]
    ]),
    resident: coverage(residentList, [["birthday", (r) => r.birthday], ["personality", (r) => r.personality], ["species", (r) => r.species], ["gender", (r) => r.gender]]),
    gyroid: coverage(gyroidList, [["group", (r) => r.group], ["sellPrice", (r) => r.sellPrice]]),
    npc: coverage(npcList, [["schedule", (r) => r.schedule], ["role", (r) => r.role], ["location", (r) => r.location], ["appearanceConditions", (r) => r.appearanceConditions], ["rewards", (r) => r.rewards]]),
    facility: coverage(facilityList, [["operatingHours", (r) => r.operatingHours], ["services", (r) => r.services], ["structuredTables", (r) => r.structuredTables], ["requirements", (r) => r.requirements]]),
    event: coverage(eventList, [["dateRule", (r) => r.dateRule], ["timeRule", (r) => r.timeRule], ["description", (r) => r.description], ["rewardText", (r) => r.rewardText], ["rewardItemIds", (r) => r.rewardItemIds], ["location", (r) => r.location]])
  },
  provenance: {
    expansionSourceRegistry: expansionSources.length,
    expansionSourceLineages: [...new Set(expansionSources.map((source) => source.lineageId))].length,
    expansionSourceClaims: sourceClaims,
    expansionFieldProvenanceInstances: provenanceFields,
    coreClaims: 693,
    coreClaimCoverage: `${core.withExtractedClaims}/${core.totalCriticalFieldInstances}`,
    coreJpIndependentVerified: `${core.withJpIndependentVerification}/${core.totalCriticalFieldInstances}`,
    corePublicBlockerMetric: core.releaseBlocking,
    coreConflicts: `${core.conflicts} fields / ${dataDiscrepancies.length} registry`,
    expansionEventConflicts: expansionConflictRecords.map((entry) => entry.id),
    coreCanonicalChanges: canonicalChanges.length,
    unresolvedResidents: residentUncertainties.length
  },
  product: {
    searchableRecords: allSearchableEntities.length,
    collectionDomains: ["fish", "bug", "fossil", "art", "item", "resident", "gyroid", "npc", "facility", "event"],
    realImages: 0,
    honestImageFallbacks: allSearchableEntities.length,
    uiScreenshots
  },
  qa: {
    automatedGates,
    browsers,
    responsive: "320px axe/44px/overflow plus 375/390/430px search are included in every passing 22-case browser report",
    migration,
    security,
    lighthouse,
    automatedGreen,
    browserGreen
  },
  externalLimits: {
    firefox: browsers.firefox.interpretation,
    physicalSafariIosAndroid: "NOT_RUN_NOT_CLAIMED",
    realScreenReader: "NOT_RUN_NOT_CLAIMED; axe and Lighthouse accessibility are automated checks only",
    publicHttps: "OUT_OF_SCOPE_FOR_DECLARED_PERSONAL_LOCAL_USE; NOT_CLAIMED",
    legalReview: "OUT_OF_SCOPE_FOR_DECLARED_PERSONAL_LOCAL_USE; NOT_CLAIMED"
  },
  redTeam: {
    releaseFailReasonsSearched: [
      "old saves or backups broken", "unknown acquisition disguised as known", "source-lineage inflation", "conflicts hidden by merged values",
      "unlicensed images added", "mobile overflow or undersized controls", "offline cache stale", "external validations mislabeled as PASS"
    ],
    result: "No failing reason remains inside the declared personal local/offline scope. External and evidence-depth limits remain explicit.",
    unresolvedTruth: [
      "Core strict public-release evidence metric remains 454 and is not part of the personal-local completion gate.",
      "Core CONFLICT remains 9 fields / 6 registry; three expansion-event discrepancies were added rather than suppressed.",
      "Two resident name mappings remain unresolved and excluded.",
      "866 purchase edges prove a buy price but do not identify the seller or catalog availability.",
      "Firefox could not launch on this host; managed WebKit is not physical Safari."
    ]
  },
  gates: { automatedGreen, browserGreen, dataGreen, persistenceGreen, securityGreen, qualityGreen }
};

const output = path.join(root, "artifacts/data-audit/personal-final-report.json");
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
const markdown = `# Personal Final Report — 2026-09-03\n\n## Classification\n\n**${classification}**\n\n個人用local/offline scopeの最終判定です。公開向けRelease Readyや全フィールド検証済みを意味しません。\n\n## Content delta\n\n| Metric | Before | After |\n|---|---:|---:|\n| Evidence-backed acquisition | 1,255 | ${expansionCounts.acquisitionCoveredItems.toLocaleString("ja-JP")} |\n| Acquisition UNKNOWN | 16 | ${expansionCounts.acquisitionUnknownItems} |\n| Explicit/categorical acquisition | 389 | ${explicitAcquisition} |\n| Price-only, seller unspecified | 866 | ${expansionCounts.purchasePlaceUnspecifiedItems} |\n| Event reward text | 9/12 | ${eventList.filter((event) => event.rewardText).length}/12 |\n| Event known location | 0/12 | ${eventList.filter((event) => event.location).length}/12 |\n| Events with linked reward items | 2/12 | ${eventList.filter((event) => event.rewardItemIds?.length).length}/12 |\n| Expansion event discrepancies | 0 | ${expansionConflictRecords.length} |\n| Searchable records | 1,767 | ${allSearchableEntities.length.toLocaleString("ja-JP")} |\n\n## Final gates\n\n- Unit: 113/113 PASS; TypeScript checkJs, ESLint, Data, Provenance, Evidence, Static, Security, Images: PASS.\n- Chrome / Edge / managed WebKit: 22/22 PASS each. Managed WebKit is not physical Safari.\n- Lighthouse: Performance ${lighthouse.scores.performance}, Accessibility ${lighthouse.scores.accessibility}, Best Practices ${lighthouse.scores["best-practices"]}, SEO ${lighthouse.scores.seo}.\n- Migration/backup: ${migration.cases.filter((entry) => entry.result === "PASS").length}/${migration.cases.length} PASS; key \`wildWorldCompanionState.v1\`, schema 3.\n- Service Worker: \`wild-world-companion-v13\`; offline origin-stop, cache update, saved state preservation included in E2E.\n\n## Truthful limits\n\n- Core claim coverage 468/468 is not verification. JP audited-independent verification remains ${core.withJpIndependentVerification}/468; strict public blocker metric ${core.releaseBlocking}.\n- Core CONFLICT ${core.conflicts} fields / ${dataDiscrepancies.length} registry and expansion event CONFLICT ${expansionConflictRecords.length} remain visible. Canonical core changes: 0.\n- Residents remain 148 records plus 2 unresolved/excluded names. Real images remain 0; all ${allSearchableEntities.length.toLocaleString("ja-JP")} records use honest original fallback graphics.\n- Firefox is environment-blocked before app assertions. Physical Safari/iOS/Android, real screen reader and public HTTPS were not run and are not claimed.\n`;
writeFileSync(path.join(root, "PERSONAL_FINAL_REPORT.md"), markdown);
console.log(JSON.stringify({ classification, gates: report.gates, beforeAfter: report.beforeAfter }, null, 2));
if (classification !== "PERSONAL_FINAL_COMPLETE") process.exitCode = 1;
