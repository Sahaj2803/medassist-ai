/**
 * Prompts for Groq's plain-language explanation calls. Groq never sees
 * the raw prescription image — it only ever receives the structured
 * JSON that Gemini already extracted (medicine name/dosage/frequency/
 * instructions, or a list of medicine names) and turns it into
 * human-readable explanation text. See backend/ai/groq.service.js.
 */

/**
 * "Medicine Explanation" + "Dosage Explanation" + "Side Effects
 * Explanation" + "Important Precautions" — all one Groq call per
 * medicine, kept in the same JSON shape the app has always used so the
 * existing dashboard UI (AnalysisPanel.jsx) keeps rendering unchanged.
 */
export function buildMedicineExplanationPrompt({ name, dosage, frequency, instructions }) {
  return `You are a clinical information assistant helping a patient understand their prescription. Respond with ONLY a JSON object — no markdown formatting, no commentary before or after — matching exactly this shape:

{
  "summary": "2-3 sentence plain-language explanation of what this medicine is used for and how it generally works, written for someone with no medical background",
  "commonUses": ["short condition or symptom it treats", "..."],
  "sideEffects": {
    "common": ["short phrase", "..."],
    "serious": ["short phrase describing a side effect that needs urgent medical attention", "..."]
  },
  "precautions": ["short practical precaution or thing to avoid", "..."],
  "disclaimer": "one sentence reminding the reader this information does not replace professional medical advice"
}

Medicine name: ${name}
Dosage: ${dosage || "unspecified"}
Frequency: ${frequency || "unspecified"}
Instructions: ${instructions || "none provided"}`;
}

/**
 * "Drug Interaction Explanation" — cross-checks a list of medicine
 * names Gemini has already extracted/confirmed and explains any
 * clinically significant interactions in plain language.
 */
export function buildInteractionPrompt(medicineNames) {
  return `You are a clinical information assistant. A patient is taking all of the following medicines at the same time. Identify any clinically significant drug-drug interactions between pairs of them. Respond with ONLY a JSON array — no markdown, no commentary. Each element must match exactly this shape:

{ "medicineA": "name", "medicineB": "name", "severity": "mild" | "moderate" | "severe", "description": "1-2 sentence plain-language explanation of the risk and what the patient should do" }

If there are no clinically significant interactions among these medicines, respond with exactly: []

Medicines: ${medicineNames.join(", ")}`;
}

export default { buildMedicineExplanationPrompt, buildInteractionPrompt };
