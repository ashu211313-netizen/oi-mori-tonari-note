import test from "node:test";
import assert from "node:assert/strict";
import { getEvidenceNoticeModel } from "../src/ui-logic.js";

test("CONFLICT fields never present the displayed value as confirmed", () => {
  const notice = getEvidenceNoticeModel([
    { status: "CONFLICT", discrepancyIds: ["disc-test"] }
  ]);
  assert.equal(notice.level, "conflict");
  assert.deepEqual(notice.discrepancyIds, ["disc-test"]);
  assert.match(notice.message, /未解決/);
  assert.match(notice.message, /確認済みとして扱わない/);
});

test("single-source and dependent corroboration remain visibly qualified", () => {
  assert.equal(getEvidenceNoticeModel([{ status: "SINGLE_SOURCE" }]).level, "single-source");
  assert.equal(getEvidenceNoticeModel([{ status: "CORROBORATED" }]).level, "corroborated");
  assert.equal(getEvidenceNoticeModel([{ status: "MULTI_SOURCE_VERIFIED" }]), null);
});
