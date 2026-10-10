
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
 * Gemini handles prescription and lab-report extraction.
 * Groq handles explanations, summaries, and chat-related tasks.
 * ============================================================================
 */

// Ordered fallback chain for Gemini document extraction.
export const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

export const GEMINI_MODEL = env.GEMINI_MODEL || GEMINI_MODELS[0];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function errorStatus(err) {
  const value = err?.status ?? err?.statusCode ?? err?.code;
  const numeric = Number(value);

  if (Number.isFinite(numeric) && numeric >= 400 && numeric <= 599) {
    return numeric;
  }

  const message = String(err?.message || "");
  const match = message.match(/\b(408|429|500|502|503|504)\b/);

  if (match) return Number(match[1]);

  if (
    /RESOURCE_EXHAUSTED|UNAVAILABLE|ECONNRESET|ETIMEDOUT|socket hang up|timed? out/i.test(
      message
    )
  ) {
    return /RESOURCE_EXHAUSTED|429/i.test(message) ? 429 : 503;
  }

  return null;
}

function isTemporaryModelError(err) {
  const status = errorStatus(err);

  return (
    [408, 429, 500, 502, 503, 504].includes(status) ||
    /ECONNRESET|ETIMEDOUT|socket hang up|temporar|high demand|overloaded/i.test(
      String(err?.message || "")
    )
  );
}

/**
 * Tries the configured fallback models sequentially.
 * Fallback happens only for temporary errors.
 */
async function generateContentWithFallback(ai, request) {
  let lastError;

  for (let i = 0; i < GEMINI_MODELS.length; i += 1) {
    const model = GEMINI_MODELS[i];

    try {
      const response = await ai.models.generateContent({
        ...request,
        model,
      });

      if (i > 0) {
        console.info(
          `[AI Gateway] Gemini extraction recovered with fallback model ${model}`
        );
      }

      return response;
    } catch (err) {
      lastError = err;
      const status = errorStatus(err);

      console.warn(
        `[AI Gateway] Gemini model ${model} failed (status ${
          status ?? "unknown"
        }): ${err?.message || "Unknown error"}`
      );

      if (
        !isTemporaryModelError(err) ||
        i === GEMINI_MODELS.length - 1
      ) {
        break;
      }

      await sleep(i === 0 ? 700 : 1400);
    }
  }

  throw lastError;
}

// Medicines below this confidence are flagged for review.
export const REVIEW_CONFIDENCE_THRESHOLD = 0.6;

let client = null;

/**
 * Lazily creates and caches the Gemini client.
 */
function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      "Gemini API key is not configured on the server. Set GEMINI_API_KEY in backend/.env.",
      503
    );
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    });
  }

  return client;
}

/**
 * Safely parses Gemini's JSON response.
 */
export function parseJsonResponse(rawText) {
  if (!rawText) {
    throw new AppError(
      "The AI service returned an empty response.",
      502
    );
  }

  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);

    const candidate =
      arrMatch && (!objMatch || arrMatch.index <= objMatch.index)
        ? arrMatch[0]
        : objMatch?.[0];

    if (candidate) {
      try {
        return JSON.parse(candidate);
      } catch {
        // Continue to the error below.
      }
    }

    throw new AppError(
      "The AI service returned an unexpected response format.",
      502
    );
  }
}

/**
 * Normalizes medicine entries.
 */
export function normalizeMedicines(rawMedicines, overallConfidence) {
  if (!Array.isArray(rawMedicines)) return [];

  return rawMedicines
    .map((m) => {
      const name =
        typeof m?.name === "string" ? m.name.trim() : "";

      if (!name) return null;

      const durationRaw = m?.durationDays;

      const durationDays =
        typeof durationRaw === "number"
          ? durationRaw
          : typeof durationRaw === "string" &&
              durationRaw.trim() !== ""
            ? Number(durationRaw) || null
            : null;

      return {
        name,
        dosage:
          typeof m?.dosage === "string" && m.dosage.trim()
            ? m.dosage.trim()
            : null,
        frequency:
          typeof m?.frequency === "string" && m.frequency.trim()
            ? m.frequency.trim()
            : null,
        durationDays,
        instructions:
          typeof m?.instructions === "string" &&
          m.instructions.trim()
            ? m.instructions.trim()
            : null,
        confidence: overallConfidence,
      };
    })
    .filter(Boolean);
}

/**
 * Normalizes prescription extraction output.
 */
export function normalizeExtractionResult(parsed) {
  const confidenceRaw = Number(parsed?.confidence);

  const confidence = Number.isFinite(confidenceRaw)
    ? Math.max(0, Math.min(1, confidenceRaw))
    : 0;

  const baseNotes =
    typeof parsed?.doctorNotes === "string"
      ? parsed.doctorNotes.trim()
      : "";

  const warnings = Array.isArray(parsed?.warnings)
    ? parsed.warnings.filter(
        (w) => typeof w === "string" && w.trim()
      )
    : [];

  const doctorNotes = warnings.length
    ? `${baseNotes}${baseNotes ? "\n\n" : ""}Warnings: ${warnings.join(
        "; "
      )}`
    : baseNotes;

  return {
    ocrText:
      typeof parsed?.ocrText === "string"
        ? parsed.ocrText.trim()
        : "",
    medicines: normalizeMedicines(
      parsed?.medicines,
      confidence
    ),
    doctorNotes,
    confidence,
  };
}

/**
 * Extracts prescription information directly from an image.
 */
export async function extractFromImage(filePath, mimeType) {
  const buffer = await fs.readFile(filePath);
  const base64Data = buffer.toString("base64");

  const ai = getGeminiClient();

  const response = await generateContentWithFallback(ai, {
    contents: [
      {
        role: "user",
        parts: [
          { text: EXTRACTION_PROMPT },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
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
 * Extracts prescription information from already-extracted PDF text.
 */
export async function extractFromText(embeddedText) {
  const ai = getGeminiClient();

  const response = await generateContentWithFallback(ai, {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildExtractionPromptForText(embeddedText),
          },
        ],
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
 * Lab Report Analyzer.
 */

const VALID_RESULT_STATUSES = [
  "within_range",
  "above_range",
  "below_range",
  "undetermined",
];

/**
 * Normalizes extracted lab-report results.
 */
export function normalizeLabResults(rawResults) {
  if (!Array.isArray(rawResults)) return [];

  return rawResults
    .map((r) => {
      const testName =
        typeof r?.testName === "string"
          ? r.testName.trim()
          : "";

      if (!testName) return null;

      const status = VALID_RESULT_STATUSES.includes(r?.status)
        ? r.status
        : "undetermined";

      return {
        testName,
        value:
          typeof r?.value === "string" && r.value.trim()
            ? r.value.trim()
            : null,
        unit:
          typeof r?.unit === "string" && r.unit.trim()
            ? r.unit.trim()
            : null,
        referenceRange:
          typeof r?.referenceRange === "string" &&
          r.referenceRange.trim()
            ? r.referenceRange.trim()
            : null,
        status,
        explanation: null,
      };
    })
    .filter(Boolean);
}

/**
 * Normalizes the complete lab-report extraction response.
 */
export function normalizeLabReportResult(parsed) {
  const confidenceRaw = Number(parsed?.confidence);

  const confidence = Number.isFinite(confidenceRaw)
    ? Math.max(0, Math.min(1, confidenceRaw))
    : 0;

  return {
    labName:
      typeof parsed?.labName === "string"
        ? parsed.labName.trim()
        : "",
    reportDate:
      typeof parsed?.reportDate === "string"
        ? parsed.reportDate.trim()
        : "",
    results: normalizeLabResults(parsed?.results),
    uncertainNote:
      typeof parsed?.uncertainNote === "string"
        ? parsed.uncertainNote.trim()
        : "",
    confidence,
  };
}

/**
 * Extracts information from a lab-report image.
 */
export async function extractLabReportFromImage(
  filePath,
  mimeType
) {
  const buffer = await fs.readFile(filePath);
  const base64Data = buffer.toString("base64");

  const ai = getGeminiClient();

  const response = await generateContentWithFallback(ai, {
    contents: [
      {
        role: "user",
        parts: [
          { text: LAB_REPORT_EXTRACTION_PROMPT },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
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
 * Extracts information from already-extracted lab-report PDF text.
 */
export async function extractLabReportFromText(embeddedText) {
  const ai = getGeminiClient();

  const response = await generateContentWithFallback(ai, {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildLabReportExtractionPromptForText(
              embeddedText
            ),
          },
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

export default {
  GEMINI_MODEL,
  GEMINI_MODELS,
  REVIEW_CONFIDENCE_THRESHOLD,
  parseJsonResponse,
  normalizeMedicines,
  normalizeExtractionResult,
  extractFromImage,
  extractFromText,
  normalizeLabResults,
  normalizeLabReportResult,
  extractLabReportFromImage,
  extractLabReportFromText,
};
