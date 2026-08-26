import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { parseJsonResponse } from "./gemini.service.js";
import { buildSummaryPrompt, buildLabReportSummaryPrompt } from "./prompts/summary.prompt.js";
import {
  buildMedicineExplanationPrompt,
  buildInteractionPrompt,
} from "./prompts/explanation.prompt.js";
import { CHAT_SYSTEM_INSTRUCTION } from "./prompts/chat.prompt.js";
import { buildDietGuidePrompt } from "./prompts/diet.prompt.js";
import { buildLanguageInstruction } from "./prompts/language.js";

/**
 * ============================================================================
 * Groq service — AI ARCHITECTURE
 *
 * This is the ONLY file in the app that talks to Groq, and it is used
 * ONLY for turning structured data (already produced by Gemini, or the
 * user's own stored medicines) into human-readable language: prescription
 * summaries, medicine/dosage/side-effect explanations, drug interaction
 * explanations, precautions, and the AI chatbot. Groq never sees a
 * prescription image and never performs OCR.
 *
 * Uses Groq's OpenAI-compatible REST API directly via fetch — same
 * lightweight pattern the app already uses for outbound HTTP calls
 * (see the old whatsappService.js), so no extra SDK dependency is
 * needed.
 *
 * Controllers never import this file directly — they go through
 * ai/aiGateway.js.
 * ============================================================================
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Model id is configurable via env; defaults to a current Groq-hosted
// Llama model well suited to fast, plain-language explanation text.
export const GROQ_MODEL = env.GROQ_MODEL || "llama-3.3-70b-versatile";
export const GROQ_DIET_MODEL = env.GROQ_DIET_MODEL || GROQ_MODEL;

function assertConfigured() {
  if (!env.GROQ_API_KEY) {
    throw new AppError(
      "Groq API key is not configured on the server. Set GROQ_API_KEY in backend/.env.",
      503
    );
  }
}

/**
 * Low-level call to Groq's chat completions endpoint.
 *
 * @param {Array<{role: "system"|"user"|"assistant", content: string}>} messages
 * @param {{json?: boolean}} [options] - when json is true, asks Groq to
 *   constrain output to a valid JSON object (use for prompts whose
 *   instructions describe a JSON object shape — not a bare JSON array).
 */
async function callGroq(messages, { json = false, model = GROQ_MODEL } = {}) {
  assertConfigured();

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new AppError(`Groq API error (${response.status}): ${errText}`, 502);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new AppError("Groq did not return a response.", 502);
  }
  return text;
}

/**
 * "Prescription Summary" — one short plain-language paragraph covering
 * the whole prescription. Input is the structured JSON Gemini already
 * extracted; never the raw image/OCR text.
 */
export async function generateSummary(structuredJson, language) {
  const text = await callGroq([
    { role: "system", content: "You write clear, reassuring, plain-language health summaries." },
    {
      role: "user",
      content: `${buildSummaryPrompt(structuredJson)}\n\n${buildLanguageInstruction(language)}`,
    },
  ]);
  return text.trim();
}

/**
 * "Medicine Explanation" / "Dosage Explanation" / "Side Effects
 * Explanation" / "Important Precautions" for a single medicine.
 * Returns the same JSON shape the app has always used.
 */
export async function explainMedicine(medicine, language) {
  const text = await callGroq(
    [
      {
        role: "system",
        content:
          "You are a clinical information assistant. You always respond with a single valid JSON object and nothing else.",
      },
      {
        role: "user",
        content: `${buildMedicineExplanationPrompt(medicine)}\n\n${buildLanguageInstruction(
          language
        )} Keep the JSON keys themselves in English exactly as specified — only the string values (summary, commonUses, sideEffects, precautions, disclaimer) should be in that language. Never translate the medicine name itself.`,
      },
    ],
    { json: true }
  );
  return parseJsonResponse(text);
}

/**
 * "Drug Interaction Explanation" across a list of medicine names.
 */
export async function checkInteractions(medicineNames, language) {
  const uniqueNames = [...new Set(medicineNames.map((n) => n.trim()).filter(Boolean))];
  if (uniqueNames.length < 2) return [];

  // Note: this prompt's documented shape is a JSON *array*, so the
  // json_object response_format constraint (object-only) isn't used
  // here — parseJsonResponse's fallback extraction handles a bare array.
  const text = await callGroq([
    {
      role: "system",
      content:
        "You are a clinical information assistant. You always respond with a single valid JSON array and nothing else.",
    },
    {
      role: "user",
      content: `${buildInteractionPrompt(uniqueNames)}\n\n${buildLanguageInstruction(
        language
      )} Keep the JSON keys ("medicineA", "medicineB", "severity", "description") in English exactly as specified, and never translate the medicine names themselves or the "severity" value — only the "description" text should be in that language.`,
    },
  ]);

  const parsed = parseJsonResponse(text);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * "AI Chatbot" / "General Medicine Questions" / "General Health
 * Guidance". Groq's OpenAI-compatible API takes a flat system/user/
 * assistant message list (unlike the old Gemini SDK's role: "model"
 * convention), which maps naturally onto the app's own {role, content}
 * message shape.
 *
 * @param {{context: string, history: Array<{role: "user"|"assistant", content: string}>, newMessage: string}} params
 */
export async function generateChatReply({ context, history, newMessage, language }) {
  const messages = [
    {
      role: "system",
      content: `${CHAT_SYSTEM_INSTRUCTION}\n\n--- User's medicine context ---\n${context}\n--- End of context ---\n\n${buildLanguageInstruction(language)}`,
    },
    ...history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    { role: "user", content: newMessage },
  ];

  const text = await callGroq(messages);
  return text.trim();
}

/**
 * "Lab Report Analysis" — overall plain-language summary plus a short
 * explanation for each notable (non-within-range) result, generated by
 * Groq from Gemini's already-structured extraction. Returns
 * { overallSummary, explanations: { [testName]: string } } — the
 * caller merges `explanations` back onto each result by testName.
 */
export async function explainLabReport(structuredJson, language) {
  const text = await callGroq(
    [
      {
        role: "system",
        content:
          "You are a clinical information assistant. You always respond with a single valid JSON object and nothing else. You never diagnose and never invent data that wasn't given to you.",
      },
      {
        role: "user",
        content: `${buildLabReportSummaryPrompt(structuredJson)}\n\n${buildLanguageInstruction(
          language
        )} Keep every JSON key in English exactly as specified ("overallSummary", "explanations", "whatItMeasures", "whyItMatters", "simpleExplanation", "interpretation", "groups", "name", "testNames") — only the string VALUES should be in that language. Never translate test names, values, units, or reference ranges.`,
      },
    ],
    { json: true }
  );
  return parseJsonResponse(text);
}

/**
 * "AI Personalized Medical Diet Guide" — structured, educational
 * dietary guidance generated from the user's supplied health context
 * and (optionally) already-extracted lab report results. Never sees a
 * report image/OCR text — only the structured data the app already
 * has. Returns the structured guide object (see diet.prompt.js for the
 * exact shape); the controller validates/stores it.
 */
export async function generateDietGuide({ healthContext, labReport, language }) {
  const text = await callGroq(
    [
      {
        role: "system",
        content:
          "You are a clinical information assistant. You always respond with a single valid JSON object and nothing else. You never diagnose, never fabricate data that wasn't given to you, and always prioritize safety over personalization.",
      },
      {
        role: "user",
        content: `${buildDietGuidePrompt({ healthContext, labReport })}\n\n${buildLanguageInstruction(
          language
        )} Keep the JSON keys themselves in English exactly as specified — only translate the text VALUES.`,
      },
    ],
    {
      json: true,
      model: GROQ_DIET_MODEL,
    }
  );
  return parseJsonResponse(text);
}

export default {
  GROQ_MODEL,
  GROQ_DIET_MODEL,
  generateSummary,
  explainMedicine,
  checkInteractions,
  generateChatReply,
  explainLabReport,
  generateDietGuide,
};
