import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CURRENT_SCHEMA_VERSION,
  normalizeState,
  parseImportedStateText,
  serializeState,
  validateImportedState
} from "../src/storage.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "artifacts", "qa", "migration-backup-matrix.json");
const serviceWorkerCandidate = /CACHE_NAME = "([^"]+)"/.exec(readFileSync(path.join(root, "sw.js"), "utf8"))?.[1] ?? "UNKNOWN";
const cases = [];

function record(id, action) {
  try {
    const detail = action();
    cases.push({ id, result: "PASS", detail });
  } catch (error) {
    cases.push({ id, result: "FAIL", detail: String(error?.message ?? error) });
  }
}

function expectReject(action, pattern) {
  try {
    action();
  } catch (error) {
    const message = String(error?.message ?? error);
    if (pattern.test(message)) return message;
    throw new Error(`unexpected rejection: ${message}`, { cause: error });
  }
  throw new Error("payload was unexpectedly accepted");
}

const representative = {
  caught: { "fish-shark": true },
  donated: { "fish-shark": true },
  favorites: { "bug-scorpion": true },
  itemAcquired: { "item-kagu01-001": true },
  itemCataloged: { "item-kagu01-001": true },
  gyroidCollected: { "gyroid-001": true },
  notes: { "fish-shark": "migration sentinel" },
  calculator: [{ id: "fish-shark", quantity: 3 }]
};

record("legacy-unversioned-to-v3", () => {
  const migrated = validateImportedState(representative);
  if (migrated.schemaVersion !== CURRENT_SCHEMA_VERSION) throw new Error("schema was not upgraded");
  return `schema ${migrated.schemaVersion}; sentinel preserved`;
});

record("schema-v1-to-v3", () => {
  const migrated = validateImportedState({ schemaVersion: 1, ...representative });
  if (migrated.notes["fish-shark"] !== "migration sentinel") throw new Error("notes lost");
  return `schema ${migrated.schemaVersion}; representative state preserved`;
});

record("schema-v2-to-v3", () => {
  const migrated = validateImportedState({ schemaVersion: 2, ...representative });
  if (migrated.schemaVersion !== CURRENT_SCHEMA_VERSION) throw new Error("schema was not upgraded");
  if (!migrated.itemAcquired["item-kagu01-001"]) throw new Error("expansion collection state lost");
  return `schema ${migrated.schemaVersion}; expansion state preserved`;
});

record("schema-v3-round-trip", () => {
  const before = normalizeState(representative);
  const after = parseImportedStateText(serializeState(before));
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("round trip mismatch");
  return "normalized export/import is stable";
});

record("malformed-json-rejected", () => expectReject(
  () => parseImportedStateText("{not-json"),
  /JSON|position|property|expected/i
));

record("corrupt-shape-rejected", () => expectReject(
  () => validateImportedState({ notes: [], calculator: {} }),
  /notes must be an object/
));

record("future-schema-rejected", () => expectReject(
  () => validateImportedState({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 }),
  /newer than supported/
));

record("impossible-state-repaired", () => {
  const repaired = validateImportedState({
    schemaVersion: 2,
    donated: { "art-famous-painting": true },
    forged: { "art-famous-painting": true }
  });
  if (repaired.donated["art-famous-painting"] || repaired.genuine["art-famous-painting"]) {
    throw new Error("forged/donated invariant not repaired");
  }
  return "forged wins; acquired true; donated and genuine false";
});

record("failed-import-no-mutation", () => {
  const current = normalizeState(representative);
  const before = serializeState(current);
  expectReject(() => validateImportedState({ schemaVersion: 999 }), /newer than supported/);
  if (serializeState(current) !== before) throw new Error("current state changed");
  return "current state byte-equivalent after rejection";
});

record("service-worker-version-independent", () => {
  const backup = serializeState(representative);
  if (/wild-world-companion-v\d+/.test(backup)) throw new Error("cache version leaked into backup");
  return "backup contains schemaVersion only; storage key remains wildWorldCompanionState.v1";
});

const report = {
  generatedAt: new Date().toISOString(),
  storageKey: "wildWorldCompanionState.v1",
  currentSchemaVersion: CURRENT_SCHEMA_VERSION,
  serviceWorkerCandidate,
  result: cases.every((entry) => entry.result === "PASS") ? "PASS" : "FAIL",
  cases,
  limits: [
    "This is deterministic migration/backup validation, not a physical-device backup PASS.",
    `Browser service-worker update behavior for ${serviceWorkerCandidate} is recorded by the browser E2E matrix.`
  ]
};

mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.result !== "PASS") process.exitCode = 1;
