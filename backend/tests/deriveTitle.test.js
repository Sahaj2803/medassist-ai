import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { deriveTitle } from "../utils/deriveTitle.js";

describe("deriveTitle", () => {
  test("returns short messages unchanged", () => {
    assert.equal(deriveTitle("What medicines am I taking?"), "What medicines am I taking?");
  });

  test("normalizes internal whitespace", () => {
    assert.equal(deriveTitle("  Hello    world  "), "Hello world");
  });

  test("truncates long messages to the max length with an ellipsis", () => {
    const long =
      "Can you explain my prescription for amoxicillin and whether it interacts with my other medications please?";
    const result = deriveTitle(long);
    assert.ok(result.length <= 48);
    assert.ok(result.endsWith("…"));
  });

  test("never exceeds the max length regardless of input length", () => {
    const result = deriveTitle("a".repeat(500));
    assert.ok(result.length <= 48);
  });
});
