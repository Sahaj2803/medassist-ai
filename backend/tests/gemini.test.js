import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseJsonResponse } from "../ai/gemini.service.js";

describe("parseJsonResponse", () => {
  test("parses a clean JSON object", () => {
    const result = parseJsonResponse('{"summary":"test"}');
    assert.deepEqual(result, { summary: "test" });
  });

  test("parses a clean JSON array", () => {
    const result = parseJsonResponse("[]");
    assert.deepEqual(result, []);
  });

  test("strips markdown json fences", () => {
    const result = parseJsonResponse('```json\n{"a":1}\n```');
    assert.deepEqual(result, { a: 1 });
  });

  test("strips bare markdown fences", () => {
    const result = parseJsonResponse('```\n{"a":1}\n```');
    assert.deepEqual(result, { a: 1 });
  });

  test("extracts an array from a response with a stray preamble sentence", () => {
    const result = parseJsonResponse(
      'Sure, here is the result:\n[{"medicineA":"A","medicineB":"B"}]'
    );
    assert.deepEqual(result, [{ medicineA: "A", medicineB: "B" }]);
  });

  test("extracts an object from a response with stray trailing text", () => {
    const result = parseJsonResponse('{"summary":"test"}\n\nLet me know if you need more!');
    assert.deepEqual(result, { summary: "test" });
  });

  test("throws a clean AppError on an empty response", () => {
    assert.throws(() => parseJsonResponse(""), /empty response/i);
  });

  test("throws a clean AppError on unparseable garbage", () => {
    assert.throws(() => parseJsonResponse("not json at all, sorry"), /unexpected response format/i);
  });
});
