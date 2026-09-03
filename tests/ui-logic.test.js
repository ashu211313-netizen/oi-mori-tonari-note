import test from "node:test";
import assert from "node:assert/strict";
import { fishList } from "../src/data.js";
import { matchesQuery, normalizeQuery, sanitizeCritterFilters } from "../src/ui-logic.js";

test("query normalization handles width, script, and repeated whitespace", () => {
  assert.equal(normalizeQuery("  サメ　 SHARK  "), "さめ shark");
  assert.equal(matchesQuery(fishList.find((item) => item.id === "fish-shark"), "ｓｈａｒｋ"), true);
  assert.equal(matchesQuery(fishList.find((item) => item.id === "fish-shark"), "さめ"), true);
});

test("switching critter type removes filters that become invisible", () => {
  const fishFilters = new Set(["now", "freshwater", "海"]);
  assert.deepEqual([...sanitizeCritterFilters(fishFilters, "bug")], ["now"]);

  const bugFilters = new Set(["undonated", "木", "水辺"]);
  assert.deepEqual([...sanitizeCritterFilters(bugFilters, "fish")], ["undonated"]);
});
