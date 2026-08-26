/**
 * Shared helper for passing the user's dashboard language preference
 * through to the AI Gateway. Used by both the chatbot and the diet
 * guide so AI text responses come back in the same language as the
 * rest of the UI, per the multilingual feature spec.
 */

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
};

/**
 * @param {string} languageCode - "en" | "hi" | "gu" (falls back to English
 *   for anything else/unset, since that's the app's default language).
 * @returns {string} an instruction line to append to an AI system prompt.
 */
export function buildLanguageInstruction(languageCode) {
  const name = LANGUAGE_NAMES[languageCode] || LANGUAGE_NAMES.en;

  if (name === "English") {
    return "Respond in English.";
  }

  return `Generate the response in ${name}. Keep medical terminology simple and understandable. Do not translate or alter medicine names, lab test names, lab values, units, or numerical values — keep those exactly as given.`;
}

export default { buildLanguageInstruction };
