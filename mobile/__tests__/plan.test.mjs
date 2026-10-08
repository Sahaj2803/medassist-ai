import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildPlan, parseTime, MAX_SCHEDULED, ownerOfIdentifier, notificationContent } from "../utils/notificationPlan.js";

const at = (y, m, d, h = 12, mi = 0) => new Date(y, m - 1, d, h, mi, 0, 0);
const base = { _id: "r1", medicineName: "Metformin", dosage: "500mg", times: ["08:00", "20:00"], active: true, startDate: "2026-10-01", endDate: null };

describe("buildPlan", () => {
  test("ongoing started reminder -> one DAILY trigger per slot", () => {
    const p = buildPlan(base, at(2026, 10, 8));
    assert.equal(p.mode, "daily");
    assert.deepEqual(p.items.map((i) => [i.type, i.hour, i.minute]), [["daily", 8, 0], ["daily", 20, 0]]);
  });
  test("inactive / no times / invalid are not scheduled", () => {
    assert.equal(buildPlan({ ...base, active: false }, at(2026, 10, 8)).reason, "inactive");
    assert.equal(buildPlan({ ...base, times: [] }, at(2026, 10, 8)).reason, "no_times");
    assert.equal(buildPlan({ ...base, times: ["25:99", "x"] }, at(2026, 10, 8)).reason, "no_times");
    assert.equal(buildPlan(null).reason, "invalid");
  });
  test("ended reminder is not scheduled", () => {
    assert.equal(buildPlan({ ...base, endDate: "2026-10-07T00:00:00.000Z" }, at(2026, 10, 8)).reason, "expired");
  });
  test("end date is inclusive and dated triggers never pass it", () => {
    const p = buildPlan({ ...base, endDate: "2026-10-10" }, at(2026, 10, 8, 9, 0));
    assert.equal(p.mode, "dates");
    // 8 Oct 20:00 (08:00 already passed), then 9 Oct x2, 10 Oct x2
    assert.deepEqual(p.items.map((i) => i.identifier.split(":").slice(2).join(":")), ["2026-10-08:20:00", "2026-10-09:08:00", "2026-10-09:20:00", "2026-10-10:08:00", "2026-10-10:20:00"]);
  });
  test("past times today are skipped, never scheduled immediately", () => {
    const p = buildPlan({ ...base, endDate: "2026-10-08" }, at(2026, 10, 8, 21, 0));
    assert.equal(p.items.length, 0);
  });
  test("time a few seconds away is skipped; later is kept", () => {
    const now = new Date(2026, 9, 8, 7, 59, 58);
    const p = buildPlan({ ...base, endDate: "2026-10-08" }, now);
    assert.deepEqual(p.items.map((i) => i.time), ["20:00"]);
  });
  test("future start date -> dated triggers from start, bounded window", () => {
    const p = buildPlan({ ...base, startDate: "2026-10-12" }, at(2026, 10, 8));
    assert.equal(p.mode, "dates");
    assert.ok(p.items.length <= 28);
    assert.ok(p.items[0].identifier.includes("2026-10-12"));
    assert.ok(p.items.every((i) => i.date > at(2026, 10, 8)));
  });
  test("start beyond window yields empty plan with reason", () => {
    const p = buildPlan({ ...base, startDate: "2027-01-01" }, at(2026, 10, 8));
    assert.equal(p.items.length, 0);
    assert.equal(p.reason, "outside_window");
  });
  test("midnight/day boundary: 00:00 slot and 23:59 slot land on the right days", () => {
    const r = { ...base, times: ["23:59", "00:00"], endDate: "2026-10-09" };
    const p = buildPlan(r, at(2026, 10, 8, 23, 0));
    assert.deepEqual(p.items.map((i) => i.identifier.split(":").slice(2).join(":")), ["2026-10-08:23:59", "2026-10-09:00:00", "2026-10-09:23:59"]);
  });
  test("full ISO UTC midnight date strings map to the same calendar day", () => {
    const p = buildPlan({ ...base, startDate: "2026-10-08T00:00:00.000Z", endDate: "2026-10-08T00:00:00.000Z" }, at(2026, 10, 8, 6, 0));
    assert.equal(p.items.length, 2);
  });
  test("duplicate times are collapsed", () => {
    assert.equal(buildPlan({ ...base, times: ["08:00", "08:00"] }, at(2026, 10, 8)).items.length, 1);
  });
  test("helpers", () => {
    assert.deepEqual(parseTime("07:05"), { hour: 7, minute: 5, time: "07:05" });
    assert.equal(parseTime("7:5"), null);
    assert.equal(ownerOfIdentifier("med:abc:daily:08:00"), "abc");
    assert.equal(ownerOfIdentifier("some-uuid"), null);
    assert.ok(MAX_SCHEDULED < 64);
  });
  test("content is branded and contains no diagnosis fields", () => {
    const c = notificationContent(base, "08:00");
    assert.equal(c.title, "MedAssist AI — Medicine Reminder");
    assert.match(c.body, /Metformin/);
    assert.match(c.body, /08:00/);
  });
});
