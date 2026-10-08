import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMedicineName,
  normalizeDosage,
  buildMedicineKey,
  dedupeExtractedMedicines,
  findMatchingPrescriptionIds,
  uniqueMedicineNames,
} from "../utils/medicineDedupe.js";

const key = (name, dosage = null, frequency = null) => buildMedicineKey({ name, dosage, frequency });
const med = (name, dosage = null, frequency = null, extra = {}) => ({
  name,
  dosage,
  frequency,
  durationDays: null,
  instructions: null,
  confidence: 0.9,
  ...extra,
});

describe("normalization (cosmetic only)", () => {
  test("case, edge and repeated whitespace do not matter", () => {
    assert.equal(key("Paracetamol"), key("paracetamol"));
    assert.equal(key(" PARACETAMOL "), key("Paracetamol"));
    assert.equal(key("Para   cetamol"), key("Para cetamol"));
  });

  test("dosage spacing/case does not matter", () => {
    assert.equal(normalizeDosage("500 mg"), "500mg");
    assert.equal(key("Paracetamol", "500 mg"), key("Paracetamol", "500mg"));
    assert.equal(key("Paracetamol", "500MG"), key("Paracetamol", "500mg"));
    assert.equal(key("Syrup X", "5 ML"), key("Syrup X", "5ml"));
  });

  test("spacing around '+' does not matter", () => {
    assert.equal(normalizeMedicineName("Paracetamol + Caffeine"), "paracetamol+caffeine");
    assert.equal(key("Paracetamol + Caffeine"), key("Paracetamol+Caffeine"));
  });

  test("frequency is normalized literally (case/space) only", () => {
    assert.equal(key("A", "1mg", " Twice  Daily "), key("A", "1mg", "twice daily"));
  });

  test("strength written inside the name equals the same strength in dosage", () => {
    assert.equal(key("Paracetamol 500 mg"), key("Paracetamol", "500mg"));
    assert.equal(key("Paracetamol 500mg", "500 mg"), key("Paracetamol", "500mg"));
  });
});

describe("things that must NOT be merged", () => {
  test("different dosage", () => {
    assert.notEqual(key("Paracetamol", "500mg"), key("Paracetamol", "650mg"));
    assert.notEqual(key("Paracetamol 500mg"), key("Paracetamol 650mg"));
  });

  test("combination product vs single ingredient", () => {
    assert.notEqual(key("Paracetamol"), key("Paracetamol + Caffeine"));
    assert.notEqual(key("Paracetamol", "500mg"), key("Paracetamol + Caffeine", "500mg"));
  });

  test("different frequency", () => {
    assert.notEqual(key("Paracetamol", "500mg", "Twice daily"), key("Paracetamol", "500mg", "As needed"));
  });

  test("spelling variants are NOT silently merged (no fuzzy matching)", () => {
    assert.notEqual(key("Paracetmol", "500mg"), key("Paracetamol", "500mg"));
  });

  test("units are not converted", () => {
    assert.notEqual(key("Drug", "500mg"), key("Drug", "0.5g"));
  });

  test("name-embedded strength that CONFLICTS with the dosage field stays distinct", () => {
    assert.notEqual(key("Paracetamol 500mg", "650mg"), key("Paracetamol", "650mg"));
    assert.notEqual(key("Paracetamol 500mg", "650mg"), key("Paracetamol", "500mg"));
  });

  test("a number that is part of the name is not treated as a strength", () => {
    assert.notEqual(key("Vitamin B12"), key("Vitamin B"));
  });

  test("dosage form prefixes are not stripped (tablet vs syrup differ)", () => {
    assert.notEqual(key("Tab Paracetamol"), key("Syp Paracetamol"));
  });
});

describe("dedupeExtractedMedicines (same AI response)", () => {
  test("same medicine twice -> one record, back-filling missing fields", () => {
    const { medicines, mergedCount } = dedupeExtractedMedicines([
      med("Paracetamol", "500mg", "Twice daily"),
      med("paracetamol", "500 mg", "twice daily", { durationDays: 5, instructions: "After food" }),
    ]);
    assert.equal(medicines.length, 1);
    assert.equal(mergedCount, 1);
    assert.equal(medicines[0].name, "Paracetamol"); // first occurrence wins
    assert.equal(medicines[0].durationDays, 5);
    assert.equal(medicines[0].instructions, "After food");
    assert.equal(medicines[0].hadConflict, undefined);
  });

  test("same name, different dosage -> both kept", () => {
    const { medicines } = dedupeExtractedMedicines([
      med("Paracetamol", "500mg", "Twice daily"),
      med("Paracetamol", "650mg", "Twice daily"),
    ]);
    assert.equal(medicines.length, 2);
  });

  test("duplicates that disagree on duration/instructions are merged but flagged", () => {
    const a = dedupeExtractedMedicines([
      med("X", "1mg", "Daily", { durationDays: 3 }),
      med("X", "1mg", "Daily", { durationDays: 5 }),
    ]).medicines;
    assert.equal(a.length, 1);
    assert.equal(a[0].hadConflict, true);

    const b = dedupeExtractedMedicines([
      med("X", "1mg", "Daily", { instructions: "Before food" }),
      med("X", "1mg", "Daily", { instructions: "After food" }),
    ]).medicines;
    assert.equal(b[0].hadConflict, true);
  });

  test("does not mutate input and preserves order", () => {
    const input = [med("B"), med("A"), med("b")];
    const snapshot = JSON.stringify(input);
    const { medicines } = dedupeExtractedMedicines(input);
    assert.equal(JSON.stringify(input), snapshot);
    assert.deepEqual(medicines.map((m) => m.name), ["B", "A"]);
  });

  test("tolerates empty / invalid input", () => {
    assert.deepEqual(dedupeExtractedMedicines([]).medicines, []);
    assert.deepEqual(dedupeExtractedMedicines(undefined).medicines, []);
  });
});

describe("findMatchingPrescriptionIds (re-upload detection)", () => {
  const row = (prescription, name, dosage, frequency, durationDays = null) => ({
    prescription,
    name,
    dosage,
    frequency,
    durationDays,
  });
  const existing = [
    row("P1", "Paracetamol", "500mg", "Twice daily", 5),
    row("P1", "Amoxicillin", "250mg", "3x daily", 7),
    row("P2", "Cetirizine", "10mg", "Once daily", 5),
  ];

  test("identical content with cosmetic differences matches the existing prescription", () => {
    const fresh = [
      med("PARACETAMOL ", "500 mg", "twice daily", { durationDays: 5 }),
      med("amoxicillin", "250mg", "3x Daily", { durationDays: 7 }),
    ];
    assert.deepEqual(findMatchingPrescriptionIds(fresh, existing), ["P1"]);
  });

  test("order does not matter", () => {
    const fresh = [
      med("Amoxicillin", "250mg", "3x daily", { durationDays: 7 }),
      med("Paracetamol", "500mg", "Twice daily", { durationDays: 5 }),
    ];
    assert.deepEqual(findMatchingPrescriptionIds(fresh, existing), ["P1"]);
  });

  test("subset is NOT a match (different prescription that shares a drug)", () => {
    const fresh = [med("Paracetamol", "500mg", "Twice daily", { durationDays: 5 })];
    assert.deepEqual(findMatchingPrescriptionIds(fresh, existing), []);
  });

  test("superset is NOT a match", () => {
    const fresh = [
      med("Paracetamol", "500mg", "Twice daily", { durationDays: 5 }),
      med("Amoxicillin", "250mg", "3x daily", { durationDays: 7 }),
      med("Ibuprofen", "400mg", "As needed"),
    ];
    assert.deepEqual(findMatchingPrescriptionIds(fresh, existing), []);
  });

  test("same drugs but a different dosage, frequency or duration is NOT a match", () => {
    const base = (over) => [
      med("Paracetamol", "500mg", "Twice daily", { durationDays: 5, ...over }),
      med("Amoxicillin", "250mg", "3x daily", { durationDays: 7 }),
    ];
    assert.deepEqual(findMatchingPrescriptionIds(base({ dosage: "650mg" }), existing), []);
    assert.deepEqual(findMatchingPrescriptionIds(base({ frequency: "Once daily" }), existing), []);
    assert.deepEqual(findMatchingPrescriptionIds(base({ durationDays: 10 }), existing), []);
  });

  test("legacy duplicate rows inside the existing prescription do not block a match", () => {
    const withLegacyDup = [...existing, row("P1", "paracetamol", "500 mg", "twice daily", 5)];
    const fresh = [
      med("Paracetamol", "500mg", "Twice daily", { durationDays: 5 }),
      med("Amoxicillin", "250mg", "3x daily", { durationDays: 7 }),
    ];
    assert.deepEqual(findMatchingPrescriptionIds(fresh, withLegacyDup), ["P1"]);
  });

  test("empty extraction or no existing medicines never matches", () => {
    assert.deepEqual(findMatchingPrescriptionIds([], existing), []);
    assert.deepEqual(findMatchingPrescriptionIds([med("A")], []), []);
  });
});

describe("uniqueMedicineNames", () => {
  test("case/space-insensitive unique list, first spelling kept", () => {
    assert.deepEqual(uniqueMedicineNames(["Paracetamol", "paracetamol ", "Aspirin", "PARACETAMOL"]), [
      "Paracetamol",
      "Aspirin",
    ]);
  });
  test("different drugs stay separate", () => {
    assert.deepEqual(uniqueMedicineNames(["Paracetamol", "Paracetamol + Caffeine"]).length, 2);
  });
});