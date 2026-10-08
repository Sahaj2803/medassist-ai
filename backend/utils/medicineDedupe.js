/**
 * Safe medicine canonicalization + duplicate detection (PHASE 2).
 *
 * Design rules (clinical safety first):
 *  - Two medicines are "the same" only if their canonical NAME, DOSAGE and
 *    FREQUENCY are all identical. Anything else is treated as different.
 *  - Normalization is purely cosmetic (case, whitespace, unicode form,
 *    "500 mg" vs "500mg", spacing around "+"). There is NO fuzzy matching,
 *    NO substring matching, NO spelling correction, and NO unit
 *    conversion — "Paracetmol" != "Paracetamol", "500mg" != "0.5g".
 *  - Numbers/dosage are never stripped. A strength written at the end of
 *    the NAME ("Paracetamol 500 mg") is only moved into the dosage slot
 *    of the KEY (never into stored data), and only when that cannot hide
 *    a conflict with a separately-supplied dosage.
 *
 * This module has no dependencies so it can be unit-tested without a DB.
 */

const UNIT = "(?:mg|mcg|µg|ug|g|ml|iu|%)";
// Trailing strength inside a name, e.g. "paracetamol 500 mg". Requires
// whitespace before the number so "vitamin b12" is never split.
const TRAILING_STRENGTH_IN_NAME = new RegExp(`^(.+?)\\s+(\\d+(?:\\.\\d+)?)\\s*(${UNIT})$`);

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

/** Unicode-fold, lowercase, collapse whitespace, trim. */
function baseNormalize(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const stripTrailingPunctuation = (s) => s.replace(/[.,;:]+$/, "").trim();

/** "Paracetamol  +  Caffeine" -> "paracetamol+caffeine" */
export function normalizeMedicineName(name) {
  return stripTrailingPunctuation(baseNormalize(name).replace(/\s*\+\s*/g, "+"));
}

/** "500 mg" -> "500mg"; "5 ML" -> "5ml". Never converts units. */
export function normalizeDosage(dosage) {
  return stripTrailingPunctuation(
    baseNormalize(dosage)
      .replace(/(\d)\s+([a-zµ%])/g, "$1$2")
      .replace(/\s*\+\s*/g, "+")
      .replace(/\s*\/\s*/g, "/")
  );
}

/** Literal normalization only — no semantic mapping of "BD" <-> "twice daily". */
export function normalizeFrequency(frequency) {
  return stripTrailingPunctuation(baseNormalize(frequency));
}

/**
 * The identity of a medicine line: canonical name + dosage + frequency.
 * Returned as a JSON string so no character in the data can collide with
 * a separator.
 */
export function buildMedicineKey({ name, dosage, frequency } = {}) {
  let n = normalizeMedicineName(name);
  let d = normalizeDosage(dosage);

  const m = n.match(TRAILING_STRENGTH_IN_NAME);
  if (m) {
    const strength = normalizeDosage(`${m[2]}${m[3]}`);
    if (d === "") {
      // Name carries the strength, dosage field empty: same thing.
      n = m[1];
      d = strength;
    } else if (d === strength) {
      // Both say the same strength: same thing.
      n = m[1];
    }
    // Otherwise the two disagree — leave the name untouched so the key
    // stays distinct instead of guessing which one is right.
  }

  return JSON.stringify([n, d, normalizeFrequency(frequency)]);
}

const durationOf = (m) => {
  const n = Number(m?.durationDays);
  return isBlank(m?.durationDays) || !Number.isFinite(n) ? "" : String(n);
};

/**
 * Identity used to decide whether a NEW upload is the same prescription
 * as an existing one: medicine key + duration. Duration is included here
 * (but not in the per-medicine key) because a renewal with the same
 * drugs for a different number of days is a genuinely new prescription.
 */
export function buildPrescriptionLineSignature(m) {
  return `${buildMedicineKey(m)}#${durationOf(m)}`;
}

/**
 * Collapses lines inside ONE extraction that are the same medicine
 * (same canonical name+dosage+frequency). First occurrence wins; missing
 * durationDays/instructions are back-filled from the later duplicate.
 * If the duplicates DISAGREE on durationDays or instructions, nothing is
 * silently discarded: the kept line is flagged `hadConflict` so the
 * caller can force user review.
 *
 * Different dosage / frequency / name => different key => never merged.
 *
 * @returns {{medicines: Array, mergedCount: number}}
 */
export function dedupeExtractedMedicines(medicines) {
  const list = Array.isArray(medicines) ? medicines : [];
  const byKey = new Map();

  for (const m of list) {
    const key = buildMedicineKey(m);
    const kept = byKey.get(key);
    if (!kept) {
      byKey.set(key, { ...m });
      continue;
    }

    if (isBlank(kept.durationDays)) {
      if (!isBlank(m.durationDays)) kept.durationDays = m.durationDays;
    } else if (!isBlank(m.durationDays) && durationOf(kept) !== durationOf(m)) {
      kept.hadConflict = true;
    }

    if (isBlank(kept.instructions)) {
      if (!isBlank(m.instructions)) kept.instructions = m.instructions;
    } else if (
      !isBlank(m.instructions) &&
      baseNormalize(kept.instructions) !== baseNormalize(m.instructions)
    ) {
      kept.hadConflict = true;
    }
  }

  return { medicines: [...byKey.values()], mergedCount: list.length - byKey.size };
}

/**
 * Given a fresh extraction and the user's existing medicine rows
 * (`{prescription, name, dosage, frequency, durationDays}`, newest
 * first), returns the ids of existing prescriptions whose medicine SET is
 * exactly equal to the extraction's (same lines, ignoring order and
 * legacy repeats). Subsets/supersets do NOT match: a new prescription
 * that merely shares some drugs with an old one is a different
 * prescription and keeps its own records.
 */
export function findMatchingPrescriptionIds(extracted, existingMedicines) {
  const wanted = new Set((extracted || []).map(buildPrescriptionLineSignature));
  if (wanted.size === 0) return [];

  const byPrescription = new Map(); // String(id) -> { id, sigs:Set }
  for (const row of existingMedicines || []) {
    const pid = String(row.prescription);
    if (!byPrescription.has(pid)) byPrescription.set(pid, { id: row.prescription, sigs: new Set() });
    byPrescription.get(pid).sigs.add(buildPrescriptionLineSignature(row));
  }

  const matches = [];
  for (const { id, sigs } of byPrescription.values()) {
    if (sigs.size === wanted.size && [...wanted].every((s) => sigs.has(s))) matches.push(id);
  }
  return matches;
}

/** Case-insensitive unique list of medicine names (for the interaction check). */
export function uniqueMedicineNames(names) {
  const seen = new Map();
  for (const n of names || []) {
    const k = normalizeMedicineName(n);
    if (k && !seen.has(k)) seen.set(k, n);
  }
  return [...seen.values()];
}

export default {
  normalizeMedicineName,
  normalizeDosage,
  normalizeFrequency,
  buildMedicineKey,
  buildPrescriptionLineSignature,
  dedupeExtractedMedicines,
  findMatchingPrescriptionIds,
  uniqueMedicineNames,
};