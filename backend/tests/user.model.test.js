import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// User.js reads env.JWT_SECRET at call time (inside getSignedJwtToken),
// so make sure one is set before the model is imported.
before(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_for_unit_tests";
});

describe("User model methods (no DB connection required)", () => {
  test("matchPassword correctly verifies a matching password", async () => {
    const { default: User } = await import("../models/User.js");
    const user = new User({ name: "Test", email: "test@example.com", password: "irrelevant" });
    // Bypass the pre-save hashing hook (which only runs on save()) by
    // setting an already-hashed value directly, the same shape a saved
    // document would have.
    user.password = await bcrypt.hash("CorrectHorse123", 12);

    assert.equal(await user.matchPassword("CorrectHorse123"), true);
  });

  test("matchPassword correctly rejects a wrong password", async () => {
    const { default: User } = await import("../models/User.js");
    const user = new User({ name: "Test", email: "test@example.com", password: "irrelevant" });
    user.password = await bcrypt.hash("CorrectHorse123", 12);

    assert.equal(await user.matchPassword("WrongPassword"), false);
  });

  test("getSignedJwtToken produces a token that verifies and carries the user id + role", async () => {
    const { default: User } = await import("../models/User.js");
    const user = new User({
      name: "Test",
      email: "test@example.com",
      password: "irrelevant",
      role: "admin",
    });

    const token = user.getSignedJwtToken();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    assert.equal(decoded.id, String(user._id));
    assert.equal(decoded.role, "admin");
  });

  test("toJSON strips password and reset-token fields", async () => {
    const { default: User } = await import("../models/User.js");
    const user = new User({ name: "Test", email: "test@example.com", password: "irrelevant" });
    user.resetPasswordToken = "some-hash";
    user.resetPasswordExpire = new Date();

    const json = user.toJSON();

    assert.equal(json.password, undefined);
    assert.equal(json.resetPasswordToken, undefined);
    assert.equal(json.resetPasswordExpire, undefined);
    assert.equal(json.__v, undefined);
    assert.equal(json.name, "Test");
  });

  test("getResetPasswordToken sets a hashed token and expiry, and returns the raw token separately", async () => {
    const { default: User } = await import("../models/User.js");
    const user = new User({ name: "Test", email: "test@example.com", password: "irrelevant" });

    const rawToken = user.getResetPasswordToken();

    assert.ok(rawToken.length > 0);
    // The stored token must be a hash, not the raw token itself —
    // otherwise a database read would leak a usable reset token.
    assert.notEqual(user.resetPasswordToken, rawToken);
    assert.ok(user.resetPasswordExpire > new Date());
  });
});
