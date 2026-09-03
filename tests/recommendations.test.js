import test from "node:test";
import assert from "node:assert/strict";
import { getSmartRecommendations } from "../src/recommendations.js";
import { bugList, fishList } from "../src/data.js";

const at = (iso) => new Date(iso);
const entities = [...fishList, ...bugList];

test("smart recommendations prioritize undonated end-of-season targets", () => {
  const recommendations = getSmartRecommendations(entities, { donated: {} }, at("2026-08-31T20:30:00"), 10);
  assert.ok(recommendations.length > 0);
  assert.ok(recommendations[0].reasons.includes("未寄贈"));
  assert.ok(recommendations.some((item) => item.reasons.includes("今日で終了")));
});

test("shark is not falsely labeled today-ending on August 31", () => {
  const recommendations = getSmartRecommendations(entities, { donated: {} }, at("2026-08-31T20:30:00"), 40);
  const shark = recommendations.find((item) => item.entity.id === "fish-shark");
  assert.ok(shark);
  assert.equal(shark.reasons.includes("今日で終了"), false);
  assert.equal(shark.reasons.includes("今出現中"), true);
});

test("weather-dependent target is conditional until weather is supplied", () => {
  const unknown = getSmartRecommendations(entities, { donated: {} }, at("2026-08-31T20:30:00"), 60);
  const unknownCoelacanth = unknown.find((item) => item.entity.id === "fish-coelacanth");
  assert.ok(unknownCoelacanth.reasons.includes("天候条件あり"));
  assert.equal(unknownCoelacanth.reasons.includes("今出現中"), false);

  const rainy = getSmartRecommendations(entities, { donated: {} }, at("2026-08-31T20:30:00"), 60, { weather: "rain" });
  const rainyCoelacanth = rainy.find((item) => item.entity.id === "fish-coelacanth");
  assert.ok(rainyCoelacanth.reasons.includes("今出現中"));
});

test("donated entities lose undonated reason", () => {
  const recommendations = getSmartRecommendations(entities, { donated: { "fish-shark": true } }, at("2026-08-31T20:30:00"), 60);
  const shark = recommendations.find((item) => item.entity.id === "fish-shark");
  assert.equal(Boolean(shark?.reasons.includes("未寄贈")), false);
});

test("currently unavailable entities are not promoted as an immediate recommendation", () => {
  const date = at("2026-08-31T12:00:00");
  const unavailable = fishList.find((item) => item.id === "fish-stringfish");
  const recommendations = getSmartRecommendations([unavailable], { donated: {} }, date, 8);
  assert.deepEqual(recommendations, []);
});

test("recommendation ties are resolved by stable entity id", () => {
  const template = fishList.find((item) => item.id === "fish-crucian-carp");
  const left = { ...template, id: "fish-a", japaneseName: "A" };
  const right = { ...template, id: "fish-b", japaneseName: "B" };
  const recommendations = getSmartRecommendations([right, left], { donated: {} }, at("2026-08-31T12:00:00"), 8);
  assert.deepEqual(recommendations.map((item) => item.entity.id), ["fish-a", "fish-b"]);
});
