import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  EXTRACTION_PROMPT,
  buildExtractionPromptForText,
  LAB_REPORT_EXTRACTION_PROMPT,
  buildLabReportExtractionPromptForText,
} from "./prompts/extraction.prompt.js";

/**
 * ============================================================================
 * Gemini service — AI ARCHITECTURE
 *
 * This is the ONLY file in the app that talks to Google Gemini, and it is
 * used ONLY for prescription reading: OCR, handwritten prescription
 * reading, image understanding, medicine/dosage/frequency/duration
 * extraction, doctor notes extraction, warning detection, confidence
 * scoring, and structured JSON generation. Gemini never explains a
 * medicine, never answers chat questions, and never generates
 * human-readable summaries — that's Groq's job (see groq.service.js).
 *
 * Controllers never import this file directly — they go through
 * ai/aiGateway.js.
 * ============================================================================
 */

// Model id is configurable via env so it can be bumped without a code
// change; defaults to the model requested for this integration.
export const GEMINI_MODEL = env.GEMINI_MODEL || "gemini-3.6-flash";

// Any medicine below this confidence is flagged needsReview instead of
// being trusted automatically.
export const REVIEW_CONFIDENCE_THRESHOLD = 0.6;

let client = null;

/**
 * Lazily creates and caches a single GoogleGenAI client for the process.
 * Throws a clean, actionable AppError instead of letting the SDK throw
 * an opaque error if the API key hasn't been configured.
 */
function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      "Gemini API key is not configured on the server. Set GEMINI_API_KEY in backend/.env.",
      503
    );
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  return client;
}

/**
 * Gemini is asked to respond as JSON (via config.responseMimeType) so in
 * the common case this is a straight JSON.parse. As a safety net for any
 * stray markdown fences or preamble text a model might still add, this
 * strips fences and, failing that, extracts the first {...} or [...]
 * block in the response before giving up.
 */
export function parseJsonResponse(rawText) {
  if (!rawText) {
    throw new AppError("The AI service returned an empty response.", 502);
  }

  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    const candidate =
      arrMatch && (!objMatch || arrMatch.index <= objMatch.index) ? arrMatch[0] : objMatch?.[0];

    if (candidate) {
      try {
        return JSON.parse(candidate);
      } catch {
        // fall through to error below
      }
    }
    throw new AppError("The AI service returned an unexpected response format.", 502);
  }
}

/**
 * Coerces Gemini's medicine entries into the exact shape the Medicine
 * model expects, defensively handling minor shape deviations (e.g. a
 * model that returns durationDays as a numeric string despite the
 * prompt's instruction).
 */
export function normalizeMedicines(rawMedicines, overallConfidence) {
  if (!Array.isArray(rawMedicines)) return [];

  return rawMedicines
    .map((m) => {
      const name = typeof m?.name === "string" ? m.name.trim() : "";
      if (!name) return null;

      const durationRaw = m?.durationDays;
      const durationDays =
        typeof durationRaw === "number"
          ? durationRaw
          : typeof durationRaw === "string" && durationRaw.trim() !== ""
          ? Number(durationRaw) || null
          : null;

      return {
        name,
        dosage: typeof m?.dosage === "string" && m.dosage.trim() ? m.dosage.trim() : null,
        frequency:
          typeof m?.frequency === "string" && m.frequency.trim() ? m.frequency.trim() : null,
        durationDays,
        instructions:
          typeof m?.instructions === "string" && m.instructions.trim()
            ? m.instructions.trim()
            : null,
        // Gemini gives one overall confidence rather than a per-medicine
        // score, so every medicine from a given extraction shares it.
        confidence: overallConfidence,
      };
    })
    .filter(Boolean);
}

/**
 * Normalizes the full extraction payload. Warning Detection is folded
 * into the existing `doctorNotes` string (rather than a new field) so
 * this plugs into the Prescription schema exactly as it already exists —
 * no schema change required.
 */
export function normalizeExtractionResult(parsed) {
  const confidenceRaw = Number(parsed?.confidence);
  const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0;

  const baseNotes = typeof parsed?.doctorNotes === "string" ? parsed.doctorNotes.trim() : "";
  const warnings = Array.isArray(parsed?.warnings)
    ? parsed.warnings.filter((w) => typeof w === "string" && w.trim())
    : [];
  const doctorNotes = warnings.length
    ? `${baseNotes}${baseNotes ? "\n\n" : ""}Warnings: ${warnings.join("; ")}`
    : baseNotes;

  return {
    ocrText: typeof parsed?.ocrText === "string" ? parsed.ocrText.trim() : "",
    medicines: normalizeMedicines(parsed?.medicines, confidence),
    doctorNotes,
    confidence,
  };
}

/**
 * Sends the raw image bytes to Gemini for direct, multimodal reading of
 * the prescription — no separate OCR engine involved.
 */
export async function extractFromImage(filePath, mimeType) {
  const buffer = await fs.readFile(filePath);
  const base64Data = buffer.toString("base64");

  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: EXTRACTION_PROMPT }, { inlineData: { mimeType, data: base64Data } }],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const parsed = parseJsonResponse(response.text);
  return normalizeExtractionResult(parsed);
}

/**
 * Sends already-extracted PDF text (pulled by the gateway via pdf-parse)
 * to Gemini as a text prompt so PDFs get the same structured
 * medicines/doctorNotes/warnings/confidence output as images do.
 */
export async function extractFromText(embeddedText) {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: buildExtractionPromptForText(embeddedText) }],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const parsed = parseJsonResponse(response.text);
  return normalizeExtractionResult(parsed);
}

export default {
  GEMINI_MODEL,
  REVIEW_CONFIDENCE_THRESHOLD,
  parseJsonResponse,
  normalizeMedicines,
  normalizeExtractionResult,
  extractFromImage,
  extractFromText,
  normalizeLabReportResult,
  extractLabReportFromImage,
  extractLabReportFromText,
};

/**
 * ----------------------------------------------------------------------
 * Lab Report Analyzer — extraction only (Gemini's job, same boundary as
 * prescriptions above). Explanation/summary is Groq's job downstream —
 * see groq.service.js's explainLabReport.
 * ----------------------------------------------------------------------
 */

const VALID_RESULT_STATUSES = ["within_range", "above_range", "below_range", "undetermined"];

/**
 * Coerces Gemini's lab-result entries into a clean, consistent shape.
 * Defensively handles a model returning an unrecognized status string,
 * or a non-string value in a text field.
 */
export function normalizeLabResults(rawResults) {
  if (!Array.isArray(rawResults)) return [];

  return rawResults
    .map((r) => {
      const testName = typeof r?.testName === "string" ? r.testName.trim() : "";
      if (!testName) return null;

      const status = VALID_RESULT_STATUSES.includes(r?.status) ? r.status : "undetermined";

      return {
        testName,
        value: typeof r?.value === "string" && r.value.trim() ? r.value.trim() : null,
        unit: typeof r?.unit === "string" && r.unit.trim() ? r.unit.trim() : null,
        // Only ever the range printed on the report itself — never
        // filled in from general knowledge. Empty means "not printed".
        referenceRange:
          typeof r?.referenceRange === "string" && r.referenceRange.trim()
            ? r.referenceRange.trim()
            : null,
        status,
        explanation: null, // filled in later by Groq, only for non-within_range results
      };
    })
    .filter(Boolean);
}

export function normalizeLabReportResult(parsed) {
  const confidenceRaw = Number(parsed?.confidence);
  const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0;

  return {
    labName: typeof parsed?.labName === "string" ? parsed.labName.trim() : "",
    reportDate: typeof parsed?.reportDate === "string" ? parsed.reportDate.trim() : "",
    results: normalizeLabResults(parsed?.results),
    uncertainNote: typeof parsed?.uncertainNote === "string" ? parsed.uncertainNote.trim() : "",
    confidence,
  };
}

/**
 * Sends the raw report image bytes to Gemini for direct, multimodal
 * reading — same pattern as extractFromImage above.
 */
export async function extractLabReportFromImage(filePath, mimeType) {
  const buffer = await fs.readFile(filePath);
  const base64Data = buffer.toString("base64");

  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: LAB_REPORT_EXTRACTION_PROMPT },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const parsed = parseJsonResponse(response.text);
  return normalizeLabReportResult(parsed);
}

/**
 * Sends already-extracted PDF text (pulled by the gateway via pdf-parse)
 * to Gemini as a text prompt — same pattern as extractFromText above.
 */
export async function extractLabReportFromText(embeddedText) {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: buildLabReportExtractionPromptForText(embeddedText) }],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const parsed = parseJsonResponse(response.text);
  return normalizeLabReportResult(parsed);
}
