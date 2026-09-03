import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeState,
  parseImportedStateText,
  serializeState,
  validateImportedState
} from "../src/storage.js";

test("invalid weather falls back to unknown", () => {
  assert.equal(normalizeState({ weather: "storm" }).weather, "unknown");
});

test("donated art is normalized to acquired genuine and not forged", () => {
  const state = normalizeState({
    donated: { "art-famous-painting": true },
    forged: { "art-famous-painting": true }
  });
  // Explicit forged state takes precedence and makes donation impossible.
  assert.equal(state.acquired["art-famous-painting"], true);
  assert.equal(state.forged["art-famous-painting"], true);
  assert.equal(state.genuine["art-famous-painting"], false);
  assert.equal(state.donated["art-famous-painting"], false);
});

test("donation implies prerequisite collection states", () => {
  const state = normalizeState({
    donated: {
      "fish-shark": true,
      "fossil-amber": true,
      "art-famous-painting": true
    }
  });
  assert.equal(state.caught["fish-shark"], true);
  assert.equal(state.acquired["fossil-amber"], true);
  assert.equal(state.identified["fossil-amber"], true);
  assert.equal(state.acquired["art-famous-painting"], true);
  assert.equal(state.genuine["art-famous-painting"], true);
  assert.equal(state.forged["art-famous-painting"], false);
});

test("calculator rows are normalized", () => {
  const state = normalizeState({ calculator: [
    { id: "fish-shark", quantity: 0 },
    { id: "fish-carp", quantity: Number.POSITIVE_INFINITY },
    null,
    { nope: true }
  ] });
  assert.deepEqual(state.calculator, [
    { id: "fish-shark", quantity: 1 },
    { id: "fish-carp", quantity: 1 }
  ]);
});

test("invalid imported date is rejected", () => {
  assert.throws(() => validateImportedState({ customDateTime: "not-a-date" }), /customDateTime is invalid/);
});

test("import rejects non-object roots and future schema versions", () => {
  assert.throws(() => validateImportedState([]), /root must be an object/);
  assert.throws(() => validateImportedState({ schemaVersion: 999 }), /newer than supported/);
});

test("local-state normalization repairs invalid dates without crashing the app", () => {
  const state = normalizeState({
    clockMode: "custom",
    customDateTime: "not-a-date",
    offsetBaseReal: "also-invalid",
    offsetBaseGame: "still-invalid"
  });
  assert.equal(state.clockMode, "real");
  assert.equal(state.customDateTime, "");
  assert.equal(state.offsetBaseReal, "");
  assert.equal(state.offsetBaseGame, "");
});

test("legacy backup survives normalize, export, and re-import without losing user state", () => {
  const legacy = {
    caught: { "fish-shark": true },
    donated: { "fish-shark": true },
    favorites: { "bug-scorpion": true },
    notes: { "fish-shark": "寄贈済み" },
    calculator: [{ id: "fish-shark", quantity: 3 }]
  };
  const normalized = normalizeState(legacy);
  const restored = parseImportedStateText(serializeState(normalized));
  assert.deepEqual(restored, normalized);
  assert.equal(restored.schemaVersion, 3);
  assert.equal(restored.caught["fish-shark"], true);
  assert.equal(restored.donated["fish-shark"], true);
});

test("backup normalization drops prototype-control keys from every keyed user map", () => {
  const restored = validateImportedState({
    notes: { constructor: "x", prototype: "y", safe: "z" },
    favorites: { constructor: true, prototype: true, safe: true }
  });
  assert.deepEqual(restored.notes, { safe: "z" });
  assert.deepEqual(restored.favorites, { safe: true });
});

test("supported v1/v2 backups and current v3 backups migrate to the same current schema", () => {
  const payload = {
    caught: { "fish-shark": true },
    favorites: { "bug-scorpion": true },
    notes: { "fish-shark": "keep me" }
  };
  const migratedV1 = validateImportedState({ schemaVersion: 1, ...payload });
  const migratedV2 = validateImportedState({ schemaVersion: 2, ...payload });
  const restoredV3 = validateImportedState({ schemaVersion: 3, ...payload });
  assert.deepEqual(migratedV1, migratedV2);
  assert.deepEqual(migratedV2, restoredV3);
  assert.equal(migratedV1.schemaVersion, 3);
});

test("expansion collection maps persist across v3 backup round trips", () => {
  const state = normalizeState({
    itemAcquired: { "item-kagu01-001": true },
    itemCataloged: { "item-kagu01-001": true },
    gyroidCollected: { "gyroid-001": true },
    favorites: { "resident-001": true }
  });
  const restored = parseImportedStateText(serializeState(state));
  assert.equal(restored.itemAcquired["item-kagu01-001"], true);
  assert.equal(restored.itemCataloged["item-kagu01-001"], true);
  assert.equal(restored.gyroidCollected["gyroid-001"], true);
  assert.equal(restored.favorites["resident-001"], true);
});

test("malformed and structurally corrupt backups are rejected", () => {
  assert.throws(() => parseImportedStateText("{not-json"), SyntaxError);
  assert.throws(() => validateImportedState({ notes: [] }), /notes must be an object/);
  assert.throws(() => validateImportedState({ calculator: {} }), /calculator must be an array/);
});

test("impossible collection combinations are repaired deterministically", () => {
  const restored = validateImportedState({
    schemaVersion: 2,
    donated: { "art-famous-painting": true, "fossil-amber": true },
    forged: { "art-famous-painting": true },
    calculator: [{ id: "fish-shark", quantity: 1_000_000 }]
  });
  assert.equal(restored.acquired["art-famous-painting"], true);
  assert.equal(restored.forged["art-famous-painting"], true);
  assert.equal(restored.genuine["art-famous-painting"], false);
  assert.equal(restored.donated["art-famous-painting"], false);
  assert.equal(restored.acquired["fossil-amber"], true);
  assert.equal(restored.identified["fossil-amber"], true);
  assert.equal(restored.calculator[0].quantity, 9999);
});

test("failed imports cannot mutate the current in-memory state", () => {
  const current = normalizeState({
    caught: { "fish-shark": true },
    notes: { "fish-shark": "current" }
  });
  const before = serializeState(current);
  assert.throws(
    () => validateImportedState({ schemaVersion: 999, notes: { "fish-shark": "replacement" } }),
    /newer than supported/
  );
  assert.equal(serializeState(current), before);
});

test("backup format is independent from service-worker cache versions", () => {
  const exported = serializeState({ favorites: { "bug-scorpion": true } });
  assert.doesNotMatch(exported, /wild-world-companion-v\d+/);
  assert.equal(parseImportedStateText(exported).favorites["bug-scorpion"], true);
});
