import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canonicalChanges, dataDiscrepancies } from "../src/data.js";
import {
  eventList,
  expansionCounts,
  expansionSources,
  itemList,
  residentUncertainties
} from "../src/expansion-data.js";

const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const storage = readFileSync(new URL("../src/storage.js", import.meta.url), "utf8");
const imageManifest = JSON.parse(readFileSync(new URL("../assets/image-manifest.json", import.meta.url), "utf8"));

const campaignNames = [
  "ハテナブロック", "ノコノコのこうら", "キノコ", "コイン", "スター", "ファイアバー", "1UPキノコ",
  "はた", "レンガブロック", "どかん", "ファイアフラワー", "キラーほうだい", "ブルーファルコン", "ピクミン",
  "スーパーマリオのかべ", "スーパーマリオのゆか"
];

test("the final 16 acquisition gaps use explicit historical-distribution evidence", () => {
  assert.equal(expansionCounts.acquisitionUnknownItems, 0);
  assert.equal(expansionCounts.acquisitionCoveredItems, itemList.length);
  for (const name of campaignNames) {
    const item = itemList.find((record) => record.japaneseName === name);
    assert.ok(item, name);
    assert.equal(item.catalogOrderable, false, name);
    assert.ok(item.acquisition.some((method) => method.evidenceKind === "EXPLICIT_HISTORICAL_DISTRIBUTION_TABLE"), name);
    assert.match(item.acquisition[0].details, /配布|プレゼント|DSステーション|すれちがい通信/, name);
  }
});

test("campaign records remain single-lineage evidence rather than inflated verification", () => {
  const campaignSource = expansionSources.find((source) => source.id === "wikiwiki-ds-official-campaigns");
  assert.ok(campaignSource);
  assert.notEqual(campaignSource.sourceClass, "OFFICIAL_PRIMARY");
  for (const name of campaignNames) {
    const item = itemList.find((record) => record.japaneseName === name);
    assert.equal(item.fieldProvenance.acquisition.status, "SINGLE_SOURCE", name);
    assert.deepEqual(item.fieldProvenance.acquisition.sourceIds, ["wikiwiki-ds-official-campaigns"], name);
  }
});

test("event enrichment exposes rewards and locations without hiding source conflicts", () => {
  const conflicts = eventList.flatMap((event) => event.dataDiscrepancies ?? []);
  assert.deepEqual(conflicts.map((entry) => entry.id).sort(), ["WW-EXP-DISC-001", "WW-EXP-DISC-002", "WW-EXP-DISC-003"]);
  const autumn = eventList.find((event) => event.id === "event-autumn-acorn-festival");
  assert.ok(autumn.rewardItemIds.length >= 12);
  assert.equal(autumn.fieldProvenance.rewardText.status, "CONFLICT");
  assert.deepEqual(autumn.fieldProvenance.rewardText.discrepancyIds, ["WW-EXP-DISC-001"]);
  const fishing = eventList.find((event) => event.japaneseName === "つり大会");
  assert.equal(fishing.fieldProvenance.timeRule.status, "CONFLICT");
  assert.ok(fishing.location);
});

test("unresolved resident and core conflicts remain explicit and canonical-safe", () => {
  assert.equal(residentUncertainties.length, 2);
  assert.equal(canonicalChanges.length, 0);
  assert.equal(dataDiscrepancies.length, 6);
});

test("final UI has cross-domain collection, friendly fallback, and disclosure surfaces", () => {
  for (const marker of [
    "function renderCollection", "homeSearch", "MY COLLECTION", "dataDiscrepancies", "retryExpansion",
    "報酬は資料に記載なし", "出典・調査情報", "画像未登録"
  ]) assert.match(app, new RegExp(marker));
  for (const token of [
    "--color-bg", "--color-primary", "--color-secondary-soft", "--radius-xl", "--shadow-float",
    ".domain-resident", ".collection-stats", ".detail-hero", ".app-notice", "prefers-reduced-motion"
  ]) assert.ok(css.includes(token), token);
});

test("final visual work keeps local-first saves and zero unlicensed real images", () => {
  assert.match(storage, /const KEY = "wildWorldCompanionState\.v1"/);
  assert.match(storage, /CURRENT_SCHEMA_VERSION = 3/);
  assert.equal(imageManifest.entries.filter((entry) => entry.status === "available").length, 0);
  assert.equal(imageManifest.entries.filter((entry) => entry.localPath).length, 0);
});
