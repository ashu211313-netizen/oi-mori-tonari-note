import test from "node:test";
import assert from "node:assert/strict";
import {
  allEntities,
  artList,
  bugList,
  dataDiscrepancies,
  fishList,
  fossilList,
  sources
} from "../src/data.js";

test("Wild World museum counts are complete", () => {
  assert.equal(fishList.length, 56);
  assert.equal(bugList.length, 56);
  assert.equal(fossilList.length, 52);
  assert.equal(artList.length, 20);
});

test("entity ids and Japanese names are unique within categories", () => {
  const ids = new Set();
  for (const entity of allEntities) {
    assert.ok(!ids.has(entity.id), `duplicate id: ${entity.id}`);
    ids.add(entity.id);
    assert.ok(entity.japaneseName, `missing Japanese name: ${entity.id}`);
    assert.ok(entity.sellPrice !== null && entity.sellPrice !== undefined, `missing sell price: ${entity.id}`);
    assert.ok(entity.sourceReferences?.length, `missing source: ${entity.id}`);
  }
});

test("fish and bugs have structured availability rules", () => {
  for (const entity of [...fishList, ...bugList]) {
    assert.ok(entity.availabilityRules.length > 0, `missing rules: ${entity.id}`);
    for (const rule of entity.availabilityRules) {
      assert.ok(rule.startMonth >= 1 && rule.startMonth <= 12, `bad start month: ${entity.id}`);
      assert.ok(rule.endMonth >= 1 && rule.endMonth <= 12, `bad end month: ${entity.id}`);
      assert.match(rule.startTime, /^\d{2}:\d{2}$/);
      assert.match(rule.endTime, /^\d{2}:\d{2}$/);
      assert.ok(rule.location, `missing location: ${entity.id}`);
    }
  }
});

test("no impossible sell prices are present", () => {
  for (const entity of allEntities) {
    assert.ok(entity.sellPrice >= 0, `negative price: ${entity.id}`);
    assert.ok(entity.sellPrice <= 20000, `suspiciously high price: ${entity.id}`);
  }
});

test("source registry and discrepancy registry are present", () => {
  assert.ok(sources.length >= 8);
  assert.ok(dataDiscrepancies.length >= 3);
});

test("all source references resolve to the source registry", () => {
  const sourceIds = new Set(sources.map((source) => source.id));
  for (const entity of allEntities) {
    for (const reference of entity.sourceReferences) {
      assert.ok(sourceIds.has(reference.sourceId), `unknown source ${reference.sourceId} on ${entity.id}`);
      assert.ok(reference.checkedAt, `missing checkedAt on ${entity.id}`);
      assert.ok(reference.confidence, `missing confidence on ${entity.id}`);
    }
  }
});

test("availability locations stay inside the known Wild World taxonomy", () => {
  const validLocations = new Set([
    "川", "池", "ため池", "滝", "河口", "海", "花", "木", "地面", "ヤシの木", "水辺",
    "明かり", "岩", "地中", "くさったカブ", "雪玉", "住人", "空中", "ゴミ", "木・花・くさったカブ"
  ]);
  for (const entity of [...fishList, ...bugList]) {
    for (const rule of entity.availabilityRules) {
      assert.ok(validLocations.has(rule.location), `unknown location ${rule.location} on ${entity.id}`);
    }
  }
});

test("no New Horizons only category is stored as a game entity", () => {
  for (const entity of allEntities) {
    assert.notEqual(entity.category, "海の幸");
  }
});

test("no placeholder text is stored as bug size", () => {
  for (const bug of bugList) {
    assert.notEqual(bug.size, "出典確認中");
  }
});

test("known core source conflicts are explicitly retained", () => {
  assert.ok(dataDiscrepancies.length >= 5);
  assert.ok(dataDiscrepancies.some((item) => item.entityId === "bug-oak-silk-moth" && item.field === "months/time"));
  assert.ok(dataDiscrepancies.some((item) => item.entityId === "bug-honeybee" && item.field === "months"));
});

test("discrepancies are stable, structured, and auditable", () => {
  const ids = new Set();
  for (const item of dataDiscrepancies) {
    assert.match(item.id, /^WW-DISC-\d{3}$/);
    assert.ok(!ids.has(item.id), `duplicate discrepancy id: ${item.id}`);
    ids.add(item.id);
    assert.equal(item.region, "JP");
    assert.ok(item.checkedAt);
    assert.ok(item.resolutionStatus);
    assert.ok(item.releaseImpact);
    assert.ok(Array.isArray(item.sourceClaimIds) && item.sourceClaimIds.length >= 2);
  }
});

test("critical fields expose truthful provenance status", () => {
  for (const entity of allEntities) {
    assert.ok(entity.fieldProvenance?.sellPrice, `missing sellPrice provenance: ${entity.id}`);
    assert.ok(entity.fieldProvenance.sellPrice.status, `missing provenance status: ${entity.id}`);
    assert.ok(Array.isArray(entity.fieldProvenance.sellPrice.sourceIds));
    if (entity.type === "fish" || entity.type === "bug") {
      assert.ok(entity.fieldProvenance.availability, `missing availability provenance: ${entity.id}`);
    }
  }
  assert.equal(
    bugList.find((item) => item.id === "bug-oak-silk-moth").fieldProvenance.sellPrice.status,
    "CONFLICT"
  );
});
