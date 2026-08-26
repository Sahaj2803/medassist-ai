import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

// Force the "not configured" fast path — this must never throw, since a
// missing/invalid .env value should never crash the reminder scheduler's
// cron tick.
describe("notification services degrade gracefully when unconfigured", () => {
  let originalEnv;

  before(() => {
    originalEnv = { ...process.env };
    process.env.SMTP_HOST = "";
    process.env.SMTP_USER = "";
    process.env.SMTP_PASS = "";
  });

  after(() => {
    process.env = originalEnv;
  });

  test("sendReminderEmail returns false instead of throwing when SMTP is unset", async () => {
    const { sendReminderEmail } = await import("../services/emailService.js");
    const result = await sendReminderEmail({
      to: "test@example.com",
      userName: "Test",
      medicineName: "Amoxicillin",
      dosage: "500mg",
      time: "09:00",
    });
    assert.equal(result, false);
  });
});
