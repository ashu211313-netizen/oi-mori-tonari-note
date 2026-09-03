import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogDomainDefinitions,
  createCatalogRecord,
  validateCatalogRecord
} from "../src/catalog-model.js";

test("catalog domains expose real, provenance-backed records", () => {
  assert.deepEqual(Object.keys(catalogDomainDefinitions), [
    "item",
    "resident",
    "gyroid",
    "npc",
    "facility"
  ]);
  const expectedCounts = { item: 1271, resident: 148, gyroid: 127, npc: 17, facility: 8 };
  for (const [domain, definition] of Object.entries(catalogDomainDefinitions)) {
    assert.equal(definition.records.length, expectedCounts[domain]);
    assert.ok(definition.collectionStateKey);
    assert.equal(definition.records.every((record) => record.sourceClaims.length > 0), true);
    assert.equal(definition.records.every((record) => Object.keys(record.fieldProvenance).length > 0), true);
  }
});

test("future records require provenance-ready status instead of invented values", () => {
  const record = createCatalogRecord({
    id: "item-test-entry",
    type: "item",
    japaneseName: "検証用項目"
  });
  assert.equal(record.verification.status, "UNVERIFIED");
  assert.deepEqual(record.sourceClaims, []);
  assert.deepEqual(record.fieldProvenance, {});
  assert.deepEqual(validateCatalogRecord(record), []);
});

test("future records reject unstable ids and unsupported domains", () => {
  assert.throws(() => createCatalogRecord({ id: "bad id", type: "item", japaneseName: "無効" }));
  assert.throws(() => createCatalogRecord({ id: "event-test", type: "event", japaneseName: "未対応" }));
});
