import test from "node:test";
import assert from "node:assert/strict";
import { validateAcquisitionRecords } from "../src/acquisition.js";
import { allExpansionEntities, itemList } from "../src/expansion-data.js";

test("all implemented acquisition references and methods validate", () => {
  assert.deepEqual(validateAcquisitionRecords(itemList, new Set(allExpansionEntities.map((record) => record.id))), []);
});

test("acquisition validation rejects dangling NPC and event references", () => {
  const records = [{
    id: "item-test",
    acquisition: [
      { methodType: "NPC", sourceEntityId: "npc-missing", details: "NPCから入手" },
      { methodType: "EVENT", sourceEntityId: "event-missing", details: "イベント報酬" }
    ]
  }];
  const errors = validateAcquisitionRecords(records, new Set());
  assert.ok(errors.some((error) => /npc-missing/.test(error)));
  assert.ok(errors.some((error) => /event-missing/.test(error)));
});

test("acquisition validation rejects invalid methods and empty details", () => {
  const errors = validateAcquisitionRecords([{ id: "item-test", acquisition: [{ methodType: "GUESS", sourceEntityId: null, details: "" }] }], new Set());
  assert.ok(errors.some((error) => /invalid acquisition method/.test(error)));
  assert.ok(errors.some((error) => /details are required/.test(error)));
});
