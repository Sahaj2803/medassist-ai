import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeMedicines, normalizeExtractionResult } from "../ai/gemini.service.js";

describe("normalizeMedicines", () => {
  test("passes through a clean, well-formed medicine", () => {
    const result = normalizeMedicines(
      [{ name: "Amoxicillin", dosage: "500mg", frequency: "3x daily", durationDays: 7, instructions: "After food" }],
      0.9
    );
    assert.deepEqual(result, [
      {
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "3x daily",
        durationDays: 7,
        instructions: "After food",
        confidence: 0.9,
      },
    ]);
  });

  test("coerces a string durationDays to a number", () => {
    const result = normalizeMedicines([{ name: "Paracetamol", durationDays: "5" }], 0.7);
    assert.equal(result[0].durationDays, 5);
  });

  test("filters out medicines with no name", () => {
    const result = normalizeMedicines([{ dosage: "10mg" }, { name: "Valid" }], 0.5);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "Valid");
  });

  test("returns an empty array when medicines is not an array", () => {
    assert.deepEqual(normalizeMedicines("not-an-array", 0.5), []);
    assert.deepEqual(normalizeMedicines(undefined, 0.5), []);
  });
});

describe("normalizeExtractionResult", () => {
  test("clamps confidence to the 0-1 range", () => {
    const result = normalizeExtractionResult({ confidence: 1.5, medicines: [] });
    assert.equal(result.confidence, 1);
  });

  test("defaults confidence to 0 when missing or non-numeric", () => {
    assert.equal(normalizeExtractionResult({}).confidence, 0);
    assert.equal(normalizeExtractionResult({ confidence: "abc" }).confidence, 0);
  });

  test("handles the nothing-legible case cleanly", () => {
    const result = normalizeExtractionResult({ ocrText: "", medicines: [], doctorNotes: "", confidence: 0 });
    assert.deepEqual(result, { ocrText: "", medicines: [], doctorNotes: "", confidence: 0 });
  });

  test("defaults non-string ocrText/doctorNotes to empty strings", () => {
    const result = normalizeExtractionResult({ ocrText: null, doctorNotes: 123, medicines: [] });
    assert.equal(result.ocrText, "");
    assert.equal(result.doctorNotes, "");
  });
});
