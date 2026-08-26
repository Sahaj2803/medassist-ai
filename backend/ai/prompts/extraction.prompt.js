/**
 * Prompt for Gemini's prescription-extraction call (image or PDF text).
 * Gemini is the ONLY model allowed to touch this step — see
 * backend/ai/gemini.service.js. It owns: OCR, handwriting reading, image
 * understanding, medicine/dosage/frequency/duration extraction, doctor
 * notes, warning detection, confidence scoring, and structured JSON
 * generation. Nothing here should ever ask Gemini to explain, summarize,
 * or give advice — that's Groq's job downstream (see explanation.prompt.js
 * and summary.prompt.js).
 */
export const EXTRACTION_PROMPT = `You are a clinical assistant specialized in reading doctor prescriptions, including messy handwriting. Carefully read the prescription provided and extract every medicine listed.

Respond with ONLY a JSON object — no markdown formatting, no commentary before or after — matching exactly this shape:

{
  "ocrText": "the full text you can read on the prescription, transcribed as literally as possible, line by line",
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "e.g. 500mg, or empty string if not legible",
      "frequency": "plain-language frequency, e.g. 'Twice daily' or 'As needed', or empty string if not legible",
      "durationDays": <number of days as an integer, or null if not specified>,
      "instructions": "e.g. 'After food', or empty string if none"
    }
  ],
  "doctorNotes": "any diagnosis, advice, or notes on the prescription that are not a medicine line, or empty string if none",
  "warnings": ["short flag for anything that looks risky or needs human attention, e.g. 'Dosage looks unusually high for this medicine', 'Handwriting on this line is ambiguous', 'Possible allergy note detected' — empty array if nothing stands out"],
  "confidence": <a single number from 0 to 1 representing your overall confidence in the accuracy of this transcription>
}

Rules:
- Only include medicines you can actually see written on the prescription. Never invent or guess a medicine that isn't there.
- If handwriting is ambiguous, still give your best reading and reflect your uncertainty in the "confidence" value rather than omitting the medicine.
- If literally nothing is legible, return "ocrText": "", "medicines": [], "doctorNotes": "", "warnings": [], "confidence": 0.
- durationDays must be a number or null — never a string.
- Do not explain, summarize, or give medical advice about any medicine — only transcribe and structure what is written. Explanations are handled by a separate step.`;

/**
 * Wraps the extraction instructions around embedded PDF text instead of
 * an image, for the PDF text-layer path in gemini.service.js.
 */
export function buildExtractionPromptForText(embeddedText) {
  return `${EXTRACTION_PROMPT}\n\nHere is the prescription text extracted from a PDF:\n"""${embeddedText}"""`;
}

/**
 * Prompt for Gemini's lab-report-extraction call (image or PDF text).
 * Same model, same "extraction only, never explain" boundary as the
 * prescription prompt above — Groq turns this into plain language
 * downstream (see summary.prompt.js's buildLabReportSummaryPrompt).
 */
export const LAB_REPORT_EXTRACTION_PROMPT = `You are a clinical assistant specialized in reading laboratory/medical test reports. Carefully read the report provided and extract every test result listed.

Respond with ONLY a JSON object — no markdown formatting, no commentary before or after — matching exactly this shape:

{
  "labName": "the laboratory or clinic name if printed on the report, or empty string if not present",
  "reportDate": "the date the report/sample was taken or issued, in YYYY-MM-DD format if determinable, or empty string if not present",
  "results": [
    {
      "testName": "e.g. Hemoglobin",
      "value": "the reported result/value, as text, e.g. '11.2'",
      "unit": "e.g. g/dL, or empty string if not present",
      "referenceRange": "the reference range EXACTLY AS PRINTED on this report, e.g. '13.0-17.0 g/dL', or empty string if the report doesn't print one",
      "status": "one of: within_range, above_range, below_range, undetermined — undetermined if you cannot confidently tell from the printed range"
    }
  ],
  "uncertainNote": "a short note naming anything you could not reliably read or extract, or empty string if the whole report was legible",
  "confidence": <a single number from 0 to 1 representing your overall confidence in the accuracy of this transcription>
}

Rules:
- Only include tests you can actually see printed on the report. Never invent a test, value, or reference range.
- ALWAYS use the reference range printed on the report itself if one is present. Never substitute a reference range from your own general knowledge — ranges vary by lab, method, age, and sex. If no range is printed for a test, leave referenceRange empty and set status to "undetermined".
- Determine status by comparing the reported value against the report's OWN printed reference range only.
- If literally nothing is legible, return "results": [], "uncertainNote": "Nothing on this report could be reliably read.", "confidence": 0.
- Do not explain what any test means, do not diagnose, and do not give advice — only transcribe and structure what is printed. Explanations are handled by a separate step.`;

/**
 * Wraps the lab-report extraction instructions around embedded PDF
 * text, mirroring buildExtractionPromptForText above.
 */
export function buildLabReportExtractionPromptForText(embeddedText) {
  return `${LAB_REPORT_EXTRACTION_PROMPT}\n\nHere is the lab report text extracted from a PDF:\n"""${embeddedText}"""`;
}

export default {
  EXTRACTION_PROMPT,
  buildExtractionPromptForText,
  LAB_REPORT_EXTRACTION_PROMPT,
  buildLabReportExtractionPromptForText,
};
