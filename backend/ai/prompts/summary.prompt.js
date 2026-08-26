/**
 * "Prescription Summary" — Groq's job of turning the structured JSON
 * Gemini extracted (medicine list + doctor notes) into one short,
 * friendly, plain-language paragraph summarizing the whole
 * prescription. Takes the already-structured data as input; never
 * touches the original image/OCR text directly.
 */
export function buildSummaryPrompt({ medicines = [], doctorNotes = "" } = {}) {
  const medicineLines = medicines.length
    ? medicines
        .map(
          (m) =>
            `- ${m.name}${m.dosage ? ` (${m.dosage})` : ""}${
              m.frequency ? `, ${m.frequency}` : ""
            }${m.durationDays ? `, for ${m.durationDays} days` : ""}${
              m.instructions ? `, ${m.instructions}` : ""
            }`
        )
        .join("\n")
    : "No medicines listed.";

  return `You are a clinical information assistant. Write a short, warm, plain-language summary (3-5 sentences) of the prescription below, written directly to the patient. Mention what the medicines are broadly for and how the overall regimen fits together, without repeating every field verbatim. End with a brief reminder to follow the doctor's exact instructions. Respond with plain text only — no markdown, no JSON, no headings.

Medicines:
${medicineLines}

Doctor's notes: ${doctorNotes || "none provided"}`;
}

/**
 * "Lab Report Analysis" — Groq's job of turning the structured test
 * results Gemini extracted into: (1) a plain-language overall summary,
 * (2) a structured "what does this test mean?" explanation for every
 * test, and (3) related-test grouping (e.g. CBC, Lipid Profile) based
 * on which tests are actually present in this report. All three come
 * from ONE call — deliberately not one request per test — since the
 * project runs on free-tier AI APIs with rate limits. Input is
 * already-structured data; never the raw report image/OCR text.
 * Response is constrained to a JSON object (see groq.service.js's
 * `json: true` call) so explanations/groups can be merged back onto
 * each result by testName.
 */
export function buildLabReportSummaryPrompt({ results = [], labName = "", reportDate = "" }) {
  const resultLines = results.length
    ? results
        .map(
          (r) =>
            `- ${r.testName}: ${r.value || "?"}${r.unit ? ` ${r.unit}` : ""} (reference range: ${
              r.referenceRange || "not printed on report"
            }) — status: ${r.status}`
        )
        .join("\n")
    : "No test results were extracted.";

  return `You are a clinical information assistant. Below is a structured list of test results already extracted from a patient's lab report (do not re-read or re-extract anything — only explain and organize what's given). Respond with ONLY a JSON object — no markdown, no commentary — matching exactly this shape:

{
  "overallSummary": "2-4 sentence plain-language summary of the report as a whole, written directly to the patient. Mention roughly how many values are within range vs. need attention, without listing every single test. End by encouraging them to discuss the findings with a healthcare professional. Never state or imply a diagnosis.",
  "explanations": {
    "<exact testName as given below>": {
      "whatItMeasures": "1-2 sentences: what this test generally measures, in plain language.",
      "whyItMatters": "1 sentence: why this test is generally performed / what it's generally used for.",
      "simpleExplanation": "1-2 sentences in the simplest possible language a non-medical person would understand.",
      "interpretation": "1-2 sentences comparing THIS patient's reported value against the reference range given below and what that means in general, non-diagnostic terms. If status is above_range or below_range, use careful wording like 'This result is outside the reference range provided on the report. There can be several reasons for this finding, and it should be interpreted together with other results and the individual's clinical context.' If status is within_range, simply note that plainly. If status is undetermined, say the report didn't provide enough information to compare against a range."
    }
  },
  "groups": [
    {
      "name": "a clear, standard laboratory category name for a set of related tests present below, e.g. 'Complete Blood Count (CBC)', 'Lipid Profile', 'Kidney Function', 'Liver Function', 'Blood Glucose', 'Thyroid Function'",
      "testNames": ["<exact testName from the list below>", "..."]
    }
  ]
}

Rules for explanations:
- Include an entry in "explanations" for EVERY test name given below, not just abnormal ones.
- Use language like "can sometimes be associated with", "possible reasons include", "a healthcare professional can evaluate this properly" — never "you have X" or any certain diagnosis.
- Do not invent a reference range or value that wasn't given below.
- Do not recommend any specific medicine, dosage, or treatment.
- If you cannot confidently explain a specific test, set all four of its fields to exactly: "An explanation could not be generated reliably for this test. Please discuss the result with a qualified healthcare professional."

Rules for groups:
- Base groups ONLY on the tests actually present in the list below — never invent a group with no matching tests, and never list a test that isn't below.
- Every test below should end up in exactly one group when it clearly belongs to a standard lab category (e.g. CBC, Lipid Profile, Kidney Function, Liver Function, Blood Glucose/Diabetes, Thyroid Function, Electrolytes, Urinalysis). If a test doesn't fit any standard category, omit it from "groups" entirely — the app will show it separately as an ungrouped result, so do not force it into an unrelated group.
- Do not create a group for a single unrelated test just to avoid leaving it ungrouped.

If uncertainNote for this report is non-empty, briefly acknowledge in overallSummary that some information may not have been fully readable and to verify against the original report.

Lab: ${labName || "not specified"}
Report date: ${reportDate || "not specified"}

Test results:
${resultLines}`;
}

export default { buildSummaryPrompt, buildLabReportSummaryPrompt };
