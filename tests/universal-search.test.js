import test from "node:test";
import assert from "node:assert/strict";
import { allSearchableEntities, searchUniversal } from "../src/universal-search.js";

test("universal index includes every core and expansion record", () => {
  assert.equal(allSearchableEntities.length, 1767);
});

test("universal search reaches every required domain", () => {
  const cases = [
    ["サメ", "fish"], ["アジアなベッド", "item"], ["アイダホ", "resident"],
    ["デカバチン", "gyroid"], ["合言葉", "npc"], ["村メロ", "facility"], ["夏の花火大会", "event"]
  ];
  for (const [query, type] of cases) assert.ok(searchUniversal(query).some((record) => record.type === type), `${query}/${type}`);
});

test("universal search supports token combinations, kana folding, English, filters, and no result", () => {
  assert.ok(searchUniversal("アジア 635").some((record) => record.id === "item-kagu01-001"));
  assert.ok(searchUniversal("でかばちん").some((record) => record.id === "gyroid-001"));
  assert.ok(searchUniversal("shark").some((record) => record.id === "fish-shark"));
  assert.equal(searchUniversal("アイダホ", "resident").every((record) => record.type === "resident"), true);
  assert.deepEqual(searchUniversal("絶対に存在しない検索語"), []);
});
