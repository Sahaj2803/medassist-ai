import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { authorize } from "../middleware/auth.js";
import { canChangeRole, canSuspend, canDelete } from "../utils/adminGuards.js";

describe("authorize middleware", () => {
  test("blocks a user without the required role with a 403", () => {
    const middleware = authorize("admin");
    const req = { user: { role: "user" } };
    let nextCalled = false;

    assert.throws(
      () => middleware(req, {}, () => { nextCalled = true; }),
      (err) => err.statusCode === 403
    );
    assert.equal(nextCalled, false);
  });

  test("allows a user with the required role through", () => {
    const middleware = authorize("admin");
    const req = { user: { role: "admin" } };
    let nextCalled = false;

    middleware(req, {}, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  });

  test("accepts multiple allowed roles", () => {
    const middleware = authorize("admin", "user");
    const req = { user: { role: "user" } };
    let nextCalled = false;

    middleware(req, {}, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  });
});

describe("admin self-protection guards (utils/adminGuards.js)", () => {
  // These exercise the real functions the controller calls — not a
  // reimplementation — so a bug fixed/introduced in adminGuards.js is
  // actually caught here.
  const selfId = "64b000000000000000000001";
  const otherId = "64b000000000000000000002";

  test("canChangeRole: blocks self-demotion, allows staying admin, allows demoting others", () => {
    assert.equal(canChangeRole(selfId, selfId, "user"), false);
    assert.equal(canChangeRole(selfId, selfId, "admin"), true);
    assert.equal(canChangeRole(otherId, selfId, "user"), true);
  });

  test("canSuspend: blocks self-suspension, allows self-reinstate, allows suspending others", () => {
    assert.equal(canSuspend(selfId, selfId, true), false);
    assert.equal(canSuspend(selfId, selfId, false), true);
    assert.equal(canSuspend(otherId, selfId, true), true);
  });

  test("canDelete: blocks self-deletion, allows deleting others", () => {
    assert.equal(canDelete(selfId, selfId), false);
    assert.equal(canDelete(otherId, selfId), true);
  });
});
