import test from "node:test";
import assert from "node:assert/strict";
import { calculateSellTotal, getEffectiveSellPrice } from "../src/pricing.js";
import { artList, fishList } from "../src/data.js";

const art = artList[0];
const shark = fishList.find((item) => item.id === "fish-shark");

test("known forgery uses forged sell price", () => {
  assert.equal(getEffectiveSellPrice(art, { forged: { [art.id]: true } }), 10);
  assert.equal(getEffectiveSellPrice(art, { forged: {} }), 490);
});

test("sell total uses effective forged price", () => {
  const total = calculateSellTotal([
    { id: art.id, quantity: 2 },
    { id: shark.id, quantity: 1 }
  ], [art, shark], { forged: { [art.id]: true } });
  assert.equal(total, 15020);
});
