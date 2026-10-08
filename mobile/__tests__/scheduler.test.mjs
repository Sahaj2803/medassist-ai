import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  getPermissionStatus, requestPermission, syncReminder, cancelReminder,
  syncAllReminders, cancelAllScheduled,
} from "../services/notificationScheduler.js";

const n = globalThis.__notif;
const store = globalThis.__asyncStore;
const NOW = new Date(2026, 9, 8, 9, 0, 0);
const rem = (id, extra = {}) => ({ _id: id, medicineName: "Metformin", dosage: "500mg", times: ["08:00", "20:00"], active: true, startDate: "2026-10-01", endDate: null, ...extra });
const ids = () => [...n.scheduled.keys()].sort();

beforeEach(() => {
  globalThis.__platform = "android";
  n.permission = { status: "granted", canAskAgain: true };
  n.nextPromptResult = "granted";
  n.scheduled.clear(); n.channels.clear(); n.promptCount = 0; n.failScheduleFor = null;
  store.clear();
});

describe("permissions", () => {
  test("granted status is reported", async () => {
    assert.equal(await getPermissionStatus(), "granted");
  });
  test("first request on Android creates the channel first, then prompts once", async () => {
    n.permission = { status: "undetermined", canAskAgain: true };
    assert.equal(await requestPermission(), "granted");
    assert.ok(n.channels.has("medicine-reminders"));
    assert.equal(n.promptCount, 1);
    assert.equal(await requestPermission(), "granted");
    assert.equal(n.promptCount, 1); // no repeat prompt
  });
  test("denied + cannot ask again -> no prompt, stays denied", async () => {
    n.permission = { status: "denied", canAskAgain: false };
    assert.equal(await requestPermission(), "denied");
    assert.equal(n.promptCount, 0);
  });
  test("user denies the prompt", async () => {
    n.permission = { status: "undetermined", canAskAgain: true };
    n.nextPromptResult = "denied";
    assert.equal(await requestPermission(), "denied");
  });
  test("scheduling without permission schedules nothing and reports it", async () => {
    n.permission = { status: "denied", canAskAgain: false };
    const r = await syncReminder(rem("a"), { now: NOW });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "permission");
    assert.equal(n.scheduled.size, 0);
  });
});

describe("scheduling", () => {
  test("eligible reminder: DAILY triggers, Android channel, branded content, no CALENDAR trigger", async () => {
    const r = await syncReminder(rem("a"), { now: NOW });
    assert.equal(r.ok, true);
    assert.deepEqual(ids(), ["med:a:daily:08:00", "med:a:daily:20:00"]);
    const s = n.scheduled.get("med:a:daily:08:00");
    assert.equal(s.trigger.type, "daily");
    assert.equal(s.trigger.channelId, "medicine-reminders");
    assert.equal(s.content.title, "MedAssist AI — Medicine Reminder");
    assert.equal(s.content.data.reminderId, "a");
    assert.ok([...n.scheduled.values()].every((x) => x.trigger.type !== "calendar"));
  });
  test("iOS: no channelId in trigger", async () => {
    globalThis.__platform = "ios";
    await syncReminder(rem("a"), { now: NOW });
    assert.equal(n.scheduled.get("med:a:daily:08:00").trigger.channelId, undefined);
  });
  test("syncing twice produces no duplicates and no reschedule", async () => {
    await syncReminder(rem("a"), { now: NOW });
    const before = [...n.scheduled.values()];
    await syncReminder(rem("a"), { now: NOW });
    await syncAllReminders([rem("a")], { now: NOW });
    await syncAllReminders([rem("a")], { now: NOW });
    assert.equal(n.scheduled.size, 2);
    assert.deepEqual([...n.scheduled.values()], before); // untouched objects
  });
  test("lost signature cache still cannot duplicate", async () => {
    await syncAllReminders([rem("a")], { now: NOW });
    store.clear();
    await syncAllReminders([rem("a")], { now: NOW });
    assert.equal(n.scheduled.size, 2);
  });
  test("concurrent syncs are serialised without duplicates", async () => {
    await Promise.all([
      syncAllReminders([rem("a")], { now: NOW }),
      syncReminder(rem("a"), { now: NOW }),
      syncAllReminders([rem("a")], { now: NOW }),
    ]);
    assert.equal(n.scheduled.size, 2);
  });
  test("update: changed times replace old ones", async () => {
    await syncReminder(rem("a"), { now: NOW });
    await syncReminder(rem("a", { times: ["07:30"] }), { now: NOW });
    assert.deepEqual(ids(), ["med:a:daily:07:30"]);
  });
  test("disable cancels; re-enable schedules again", async () => {
    await syncReminder(rem("a"), { now: NOW });
    await syncReminder(rem("a", { active: false }), { now: NOW });
    assert.equal(n.scheduled.size, 0);
    await syncReminder(rem("a"), { now: NOW });
    assert.equal(n.scheduled.size, 2);
  });
  test("delete/cancel removes only that reminder", async () => {
    await syncAllReminders([rem("a"), rem("b")], { now: NOW });
    assert.equal(n.scheduled.size, 4);
    await cancelReminder("a");
    assert.deepEqual(ids(), ["med:b:daily:08:00", "med:b:daily:20:00"]);
  });
  test("reminder missing from backend list is cancelled (orphan cleanup)", async () => {
    await syncAllReminders([rem("a"), rem("b")], { now: NOW });
    await syncAllReminders([rem("b")], { now: NOW });
    assert.deepEqual(ids(), ["med:b:daily:08:00", "med:b:daily:20:00"]);
  });
  test("a just-created reminder is not wiped by a stale backend list", async () => {
    await syncReminder(rem("new"), { now: NOW });
    await syncAllReminders([rem("old")], { now: NOW }); // list fetched before 'new' existed
    assert.ok(ids().some((i) => i.startsWith("med:new:")));
  });
  test("expired and past-only reminders schedule nothing", async () => {
    const a = await syncReminder(rem("a", { endDate: "2026-10-07" }), { now: NOW });
    const b = await syncReminder(rem("b", { endDate: "2026-10-08", times: ["08:00"] }), { now: NOW });
    assert.equal(a.reason, "expired");
    assert.equal(b.scheduled, 0);
    assert.equal(n.scheduled.size, 0);
  });
  test("end-dated reminder uses bounded one-shot DATE triggers", async () => {
    await syncReminder(rem("a", { endDate: "2026-10-10" }), { now: NOW });
    assert.equal(n.scheduled.size, 5);
    assert.ok([...n.scheduled.values()].every((x) => x.trigger.type === "date" && x.trigger.date > NOW));
  });
  test("day rollover re-plans a windowed reminder", async () => {
    const r = rem("a", { endDate: "2026-10-12" });
    await syncReminder(r, { now: NOW });
    const before = n.scheduled.size;
    await syncAllReminders([r], { now: new Date(2026, 9, 9, 9, 0, 0) });
    assert.ok(n.scheduled.size < before);
    assert.ok([...n.scheduled.values()].every((x) => x.trigger.date > new Date(2026, 9, 9, 9, 0, 0)));
  });
  test("global cap keeps total under the iOS 64 limit", async () => {
    const many = Array.from({ length: 12 }, (_, i) => rem(`r${i}`, { endDate: "2026-12-31", times: ["06:00", "12:00", "18:00", "22:00"] }));
    await syncAllReminders(many, { now: NOW });
    assert.ok(n.scheduled.size <= 60, `scheduled ${n.scheduled.size}`);
  });
  test("scheduling failure is reported (not swallowed) and retried next sync", async () => {
    n.failScheduleFor = "20:00";
    const r = await syncReminder(rem("a"), { now: NOW });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "error");
    assert.equal(r.failed, 1);
    n.failScheduleFor = null;
    const again = await syncReminder(rem("a"), { now: NOW });
    assert.equal(again.ok, true);
    assert.equal(n.scheduled.size, 2);
  });
  test("failed scheduling logs no medicine name", async (t) => {
    const logs = [];
    t.mock.method(console, "warn", (...a) => logs.push(a.join(" ")));
    n.failScheduleFor = "daily";
    await syncReminder(rem("a"), { now: NOW });
    assert.ok(logs.length > 0);
    assert.ok(logs.every((l) => !/Metformin|500mg/.test(l)));
  });
  test("legacy random-UUID notifications from older builds are replaced, not duplicated", async () => {
    n.scheduled.set("legacy-uuid", { identifier: "legacy-uuid", content: { data: { reminderId: "a" } }, trigger: { type: "calendar" } });
    await syncAllReminders([rem("a")], { now: NOW });
    assert.ok(!n.scheduled.has("legacy-uuid"));
    assert.equal(n.scheduled.size, 2);
  });
  test("permission granted later: next sync schedules existing reminders", async () => {
    n.permission = { status: "denied", canAskAgain: true };
    const list = [rem("a"), rem("b")];
    const first = await syncAllReminders(list, { now: NOW });
    assert.equal(first.permission, "not_granted");
    assert.equal(n.scheduled.size, 0);
    n.permission = { status: "granted", canAskAgain: true };
    await syncAllReminders(list, { now: NOW });
    assert.equal(n.scheduled.size, 4);
  });
});

describe("account safety", () => {
  test("logout clears everything scheduled and the cache", async () => {
    await syncAllReminders([rem("a"), rem("b")], { now: NOW });
    await cancelAllScheduled();
    assert.equal(n.scheduled.size, 0);
  });
  test("account switch: other user's reminders are cancelled on next sync", async () => {
    await syncAllReminders([rem("userA-1")], { now: NOW });
    await new Promise((r) => setTimeout(r, 0));
    // Simulate a different session with no recent local writes by clearing the guard via logout path
    await cancelAllScheduled();
    await syncAllReminders([rem("userB-1")], { now: NOW });
    assert.ok(ids().every((i) => i.startsWith("med:userB-1:")));
  });
  test("account switch without explicit logout (session expiry) still reconciles", async () => {
    // userA's notifications exist from an earlier app run (no recent in-process writes)
    n.scheduled.set("med:userA-1:daily:08:00", { identifier: "med:userA-1:daily:08:00", content: { data: { reminderId: "userA-1" } }, trigger: {} });
    await syncAllReminders([rem("userB-1")], { now: NOW });
    assert.ok(ids().every((i) => i.startsWith("med:userB-1:")));
  });
});
