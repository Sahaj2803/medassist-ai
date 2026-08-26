import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { defaultTimesForFrequency, computeEndDate } from "../utils/scheduleTimes.js";

describe("defaultTimesForFrequency", () => {
  const cases = [
    ["Once daily", ["09:00"]],
    ["Twice daily", ["09:00", "21:00"]],
    ["3x daily", ["08:00", "14:00", "20:00"]],
    ["4x daily", ["08:00", "12:00", "16:00", "20:00"]],
    ["At bedtime", ["22:00"]],
    ["As needed", []],
    ["SOS", []],
    ["PRN", []],
    ["Once in the morning, night", ["08:00", "20:00"]],
    ["Once in the morning, afternoon, night", ["08:00", "14:00", "20:00"]],
    [null, ["09:00"]],
    ["Some unrecognized shorthand", ["09:00"]],
  ];

  for (const [input, expected] of cases) {
    test(`"${input}" -> ${JSON.stringify(expected)}`, () => {
      assert.deepEqual(defaultTimesForFrequency(input), expected);
    });
  }

  // Regression test for a real bug found during Phase 5 verification:
  // "night" alone used to match before the combined morning+night check
  // could run, since both patterns contain the word "night".
  test("combined morning+night phrasing is not shadowed by the standalone night check", () => {
    const result = defaultTimesForFrequency("Once in the morning, night");
    assert.deepEqual(result, ["08:00", "20:00"]);
    assert.notDeepEqual(result, ["22:00"]);
  });
});

describe("computeEndDate", () => {
  test("adds durationDays to the start date", () => {
    const start = new Date("2026-08-01T00:00:00.000Z");
    const end = computeEndDate(start, 7);
    assert.equal(end.toISOString().slice(0, 10), "2026-08-08");
  });

  test("returns null when durationDays is not provided", () => {
    const start = new Date("2026-08-01T00:00:00.000Z");
    assert.equal(computeEndDate(start, null), null);
    assert.equal(computeEndDate(start, undefined), null);
  });
});
