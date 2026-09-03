import test from "node:test";
import assert from "node:assert/strict";
import {
  eventList,
  facilityList,
  gyroidList,
  itemList,
  npcList,
  residentList,
  residentUncertainties
} from "../src/expansion-data.js";
import { eventsForMonth, residentBirthdaysForMonth } from "../src/calendar-content.js";
import { allSearchableEntities, searchUniversal } from "../src/universal-search.js";

test("content finisher adds real event and item records instead of empty models", () => {
  assert.equal(eventList.length, 12);
  assert.ok(itemList.length > 1130, itemList.length);
  assert.ok(allSearchableEntities.length > 1614, allSearchableEntities.length);
  assert.ok(eventList.every((event) => event.dateRule && event.timeRule && event.description));
});

test("buy-price evidence creates honest purchase edges without inventing a seller", () => {
  const covered = itemList.filter((item) => item.acquisition.length > 0);
  const unknown = itemList.filter((item) => item.acquisition.length === 0);
  assert.ok(covered.length > 1000, covered.length);
  assert.ok(unknown.length < 100, unknown.length);
  for (const item of covered) {
    for (const method of item.acquisition) {
      assert.ok(method.sourceType, `${item.id}: sourceType`);
      assert.ok(method.evidenceKind, `${item.id}: evidenceKind`);
      assert.ok(method.details, `${item.id}: details`);
      if (method.evidenceKind === "EXPLICIT_BUY_PRICE_COLUMN" && !method.sourceEntityId) {
        assert.equal(method.sourceType, "RETAIL_OR_CATALOG_UNSPECIFIED");
        assert.match(method.details, /販売場所は出典表に記載なし/);
      }
    }
  }
});

test("resident identities are joined to the explicit Wild World roster while conflicts stay excluded", () => {
  assert.equal(residentList.length, 148);
  assert.equal(residentUncertainties.length, 2);
  assert.ok(residentList.every((resident) => resident.englishName && resident.species && resident.gender));
  assert.equal(residentList.some((resident) => ["カルビ", "カルピ", "モモコ", "ももこ"].includes(resident.japaneseName)), false);
});

test("NPC, facility, and gyroid records expose source-backed quick-answer fields", () => {
  assert.ok(npcList.every((npc) => npc.schedule && npc.role && npc.location));
  assert.ok(npcList.filter((npc) => npc.rewards?.length).length >= 8);
  assert.ok(facilityList.filter((facility) => facility.operatingHours).length >= 7);
  assert.ok(facilityList.some((facility) => facility.upgrades?.length));
  assert.ok(facilityList.some((facility) => facility.requirements?.length));
  assert.ok(gyroidList.every((gyroid) => gyroid.group && gyroid.fieldProvenance.group));
});

test("calendar and universal search answer event and birthday questions", () => {
  assert.ok(eventsForMonth(eventList, 8).some((event) => event.japaneseName === "夏の花火大会"));
  assert.ok(residentBirthdaysForMonth(residentList, 9).some((entry) => entry.japaneseName === "アイダホ"));
  assert.ok(searchUniversal("夏 花火 19時").some((record) => record.type === "event"));
  assert.ok(searchUniversal("アイダホ 9月28日").some((record) => record.id === "resident-004"));
});
