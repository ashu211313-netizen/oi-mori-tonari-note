import test from "node:test";
import assert from "node:assert/strict";
import {
  getAvailabilityStatus,
  getCurrentAvailabilityWindow,
  getGameDate,
  getLeavingThisMonth,
  getLeavingToday,
  getNextAvailableTime,
  getRemainingAvailability,
  isAvailableThisMonth,
  isAvailableNow,
  isDateInRange,
  isTimeInRange,
  setCalendarMonth
} from "../src/availability.js";
import { bugList, fishList } from "../src/data.js";

const at = (iso) => new Date(iso);
const shark = fishList.find((item) => item.id === "fish-shark");
const stringfish = fishList.find((item) => item.id === "fish-stringfish");
const bitterling = fishList.find((item) => item.id === "fish-bitterling");
const coelacanth = fishList.find((item) => item.id === "fish-coelacanth");
const crucian = fishList.find((item) => item.id === "fish-crucian-carp");
const butterfly = bugList.find((item) => item.id === "bug-common-butterfly");
const scorpion = bugList.find((item) => item.id === "bug-scorpion");
const ant = bugList.find((item) => item.id === "bug-ant");
const bee = bugList.find((item) => item.id === "bug-bee");

const rain = { weather: "rain" };
const dry = { weather: "dry" };

test("cross-midnight time ranges include late night and early morning", () => {
  const rule = { startTime: "23:00", endTime: "04:00", crossesMidnight: true };
  assert.equal(isTimeInRange(23 * 60, rule), true);
  assert.equal(isTimeInRange(3 * 60 + 59, rule), true);
  assert.equal(isTimeInRange(4 * 60, rule), false);
  assert.equal(isTimeInRange(22 * 60 + 59, rule), false);
});

test("equal start and end only means all-day when explicitly declared", () => {
  const ambiguous = { startTime: "09:00", endTime: "09:00", allDay: false };
  assert.equal(isTimeInRange(12 * 60, ambiguous), false);
  assert.equal(isTimeInRange(9 * 60, ambiguous), false);
  assert.equal(isTimeInRange(12 * 60, { ...ambiguous, allDay: true }), true);
});

test("year wrapping date ranges include December and January", () => {
  const rule = { startMonth: 12, startDay: 1, endMonth: 1, endDay: 31 };
  assert.equal(isDateInRange(12, 31, rule), true);
  assert.equal(isDateInRange(1, 1, rule), true);
  assert.equal(isDateInRange(2, 1, rule), false);
});

test("February month-end rules include leap day", () => {
  assert.equal(isAvailableNow(bitterling, at("2028-02-29T23:00:00")), true);
});

test("shark availability follows June to September morning/evening/night", () => {
  assert.equal(isAvailableNow(shark, at("2026-08-31T20:30:00")), true);
  assert.equal(isAvailableNow(shark, at("2026-08-31T09:00:00")), false);
  assert.equal(isAvailableNow(shark, at("2026-10-01T20:30:00")), false);
});

test("stringfish handles December to January range", () => {
  assert.equal(isAvailableNow(stringfish, at("2026-12-31T23:59:00")), true);
  assert.equal(isAvailableNow(stringfish, at("2027-01-01T00:00:00")), true);
  assert.equal(isAvailableNow(stringfish, at("2027-03-01T00:00:00")), false);
});

test("common butterfly September is morning only", () => {
  assert.equal(isAvailableNow(butterfly, at("2026-09-10T07:59:00")), true);
  assert.equal(isAvailableNow(butterfly, at("2026-09-10T08:00:00")), false);
});

test("scorpion night boundary is exact", () => {
  assert.equal(isAvailableNow(scorpion, at("2026-08-01T18:59:00")), false);
  assert.equal(isAvailableNow(scorpion, at("2026-08-01T19:00:00")), true);
  assert.equal(isAvailableNow(scorpion, at("2026-08-02T03:59:00")), true);
  assert.equal(isAvailableNow(scorpion, at("2026-08-02T04:00:00")), false);
});

test("weather-gated coelacanth is conditional when weather is unknown", () => {
  const date = at("2026-08-31T20:30:00");
  assert.equal(getAvailabilityStatus(coelacanth, date), "conditional");
  assert.equal(isAvailableNow(coelacanth, date), false);
  assert.equal(isAvailableNow(coelacanth, date, rain), true);
  assert.equal(isAvailableNow(coelacanth, date, dry), false);
});

test("ant requires non-rain/non-snow weather", () => {
  const date = at("2026-08-31T12:00:00");
  assert.equal(getAvailabilityStatus(ant, date), "conditional");
  assert.equal(getAvailabilityStatus(ant, date, dry), "conditional");
  assert.equal(isAvailableNow(ant, date, { ...dry, knownConditions: { spoiled_turnip: true } }), true);
  assert.equal(isAvailableNow(ant, date, { ...rain, knownConditions: { spoiled_turnip: true } }), false);
});

test("action-gated catches stay conditional until the action is known", () => {
  const date = at("2026-08-31T12:00:00");
  assert.equal(getAvailabilityStatus(bee, date), "conditional");
  assert.equal(getAvailabilityStatus(bee, date, { knownConditions: { tree_shake: true } }), "available");
  assert.equal(getAvailabilityStatus(bee, date, { knownConditions: { tree_shake: false } }), "unavailable");
});

test("next availability lands on exact rule boundary", () => {
  const next = getNextAvailableTime(coelacanth, at("2026-08-31T09:01:00"), rain);
  assert.equal(next.getHours(), 16);
  assert.equal(next.getMinutes(), 0);
});

test("next availability is unknown for weather-gated entity when weather is unknown", () => {
  assert.equal(getNextAvailableTime(coelacanth, at("2026-08-31T09:01:00")), null);
});

test("current availability window merges adjacent shark time rules", () => {
  const window = getCurrentAvailabilityWindow(shark, at("2026-08-31T20:30:00"));
  assert.equal(window.end.getMonth() + 1, 9);
  assert.equal(window.end.getDate(), 1);
  assert.equal(window.end.getHours(), 9);
  assert.equal(window.end.getMinutes(), 0);
});

test("remaining availability uses merged continuous window", () => {
  const remaining = getRemainingAvailability(shark, at("2026-08-31T20:30:00"));
  assert.equal(remaining, 12.5 * 60 * 60 * 1000);
});

test("all-year all-day entity does not show a fake midnight countdown", () => {
  assert.equal(getRemainingAvailability(crucian, at("2026-08-31T20:30:00")), null);
});

test("month helpers only flag true seasonal exit", () => {
  assert.equal(isAvailableThisMonth(shark, 8), true);
  assert.equal(isAvailableThisMonth(shark, 10), false);
  assert.equal(getLeavingThisMonth(shark, 8), false);
  assert.equal(getLeavingThisMonth(shark, 9), true);
  assert.equal(getLeavingThisMonth(coelacanth, 12), false);
});

test("leaving today means seasonal last date, not a daily time boundary", () => {
  assert.equal(getLeavingToday(shark, at("2026-08-31T20:30:00")), false);
  assert.equal(getLeavingToday(shark, at("2026-09-30T20:30:00")), true);
});

test("calendar month switch clamps day instead of overflowing", () => {
  const feb2026 = setCalendarMonth(at("2026-08-31T20:30:00"), 2);
  assert.equal(feb2026.getMonth() + 1, 2);
  assert.equal(feb2026.getDate(), 28);
  const feb2028 = setCalendarMonth(at("2028-03-31T20:30:00"), 2);
  assert.equal(feb2028.getMonth() + 1, 2);
  assert.equal(feb2028.getDate(), 29);
});

test("game clock offset mode advances from real base", () => {
  const date = getGameDate({
    clockMode: "offset",
    offsetBaseReal: "2026-08-31T10:00:00.000Z",
    offsetBaseGame: "2026-09-15T20:30:00.000Z"
  }, at("2026-08-31T11:15:00.000Z"));
  assert.equal(date.toISOString(), "2026-09-15T21:45:00.000Z");
});
