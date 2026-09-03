import test from "node:test";
import assert from "node:assert/strict";
import {
  allExpansionEntities,
  expansionCounts,
  expansionSources,
  facilityList,
  eventList,
  gyroidList,
  itemList,
  matchesExpansionQuery,
  npcList,
  residentList,
  residentUncertainties
} from "../src/expansion-data.js";

test("expansion domains contain the implemented real-record baseline", () => {
  assert.equal(npcList.length, 17);
  assert.equal(facilityList.length, 8);
  assert.equal(gyroidList.length, 127);
  assert.equal(residentList.length, 148);
  assert.equal(itemList.length, 1271);
  assert.equal(eventList.length, 12);
  assert.equal(allExpansionEntities.length, 1583);
  assert.equal(expansionCounts.acquisitionCoveredItems, 1271);
  assert.equal(expansionCounts.acquisitionUnknownItems, 0);
});

test("every expansion record has stable identity, local image metadata, and resolvable provenance", () => {
  const sourceIds = new Set(expansionSources.map((source) => source.id));
  const ids = new Set();
  for (const record of allExpansionEntities) {
    assert.match(record.id, new RegExp(`^${record.type}-[a-z0-9-]+$`));
    assert.equal(ids.has(record.id), false, record.id);
    ids.add(record.id);
    assert.ok(record.japaneseName);
    assert.equal(record.image.status, "missing");
    assert.equal(record.image.localPath, null);
    assert.ok(record.sourceClaims.length > 0);
    for (const reference of record.sourceReferences) assert.equal(sourceIds.has(reference.sourceId), true, reference.sourceId);
    for (const entry of Object.values(record.fieldProvenance)) {
      for (const sourceId of entry.sourceIds) assert.equal(sourceIds.has(sourceId), true, sourceId);
    }
  }
});

test("resident reconciliation keeps two naming conflicts unresolved instead of guessing", () => {
  assert.equal(residentUncertainties.length, 2);
  assert.deepEqual(residentUncertainties.map((entry) => entry.sourceName), ["カルビ", "モモコ"]);
  assert.equal(residentList.some((resident) => ["カルビ", "カルピ", "モモコ", "ももこ"].includes(resident.japaneseName)), false);
  assert.equal(residentList.filter((resident) => resident.species === "サル").length, 6);
});

test("gyroid and item values are real source rows rather than placeholders", () => {
  assert.deepEqual(
    gyroidList.slice(0, 3).map((record) => [record.japaneseName, record.sellPrice]),
    [["デカバチンはにわ", 828], ["ナミバチンはにわ", 828], ["チビバチンはにわ", 828]]
  );
  const bed = itemList.find((item) => item.japaneseName === "アジアなベッド");
  assert.equal(bed.buyPrice, 2540);
  assert.equal(bed.sellPrice, 635);
  assert.equal(bed.acquisition[0].methodType, "NPC");
  assert.equal(bed.acquisition[0].sourceEntityId, "npc-tsunekichi");
});

test("expansion search supports kana folding and field-level partial matches", () => {
  assert.equal(matchesExpansionQuery(gyroidList[0], "でかばちん"), true);
  assert.equal(matchesExpansionQuery(residentList.find((record) => record.japaneseName === "アイダホ"), "9月28"), true);
  assert.equal(matchesExpansionQuery(npcList.find((record) => record.japaneseName === "つねきち"), "合言葉"), true);
  assert.equal(matchesExpansionQuery(facilityList.find((record) => record.japaneseName === "役場"), "村メロ"), true);
});
