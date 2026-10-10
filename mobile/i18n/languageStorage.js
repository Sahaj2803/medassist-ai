// Thin adapter over an AsyncStorage-compatible object (injected so this file
// has no native imports and is testable). Language is a non-sensitive UI
// preference, so AsyncStorage (same as the theme mode) is used, not SecureStore.
import { isSupportedLanguage } from "./index.js";

export const LANGUAGE_STORAGE_KEY = "medassist_language";

export function createLanguageStorage(asyncStorage) {
  return {
    /** Returns a supported code, or null for missing/invalid/unreadable values. */
    async get() {
      try {
        const value = await asyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        return isSupportedLanguage(value) ? value : null;
      } catch {
        return null;
      }
    },
    async set(code) {
      if (!isSupportedLanguage(code)) return;
      try {
        await asyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      } catch {
        // Non-fatal: language still applies for this session.
      }
    },
    async clear() {
      try {
        await asyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
      } catch {
        // Non-fatal
      }
    },
  };
}
