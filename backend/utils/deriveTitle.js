const TITLE_MAX_LENGTH = 48;

/**
 * Derives a short, readable chat title from the first user message.
 * Truncated rather than sent to Gemini for a title, to avoid an extra
 * AI call just for sidebar text.
 */
export function deriveTitle(firstMessage) {
  const clean = firstMessage.trim().replace(/\s+/g, " ");
  if (clean.length <= TITLE_MAX_LENGTH) return clean;
  return `${clean.slice(0, TITLE_MAX_LENGTH - 1)}…`;
}

export default deriveTitle;
