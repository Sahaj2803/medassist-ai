import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import translations, { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "../i18n/translations.js";

export const LanguageContext = createContext(undefined);

const STORAGE_KEY = "medassist_language";
const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_CODES.includes(stored) ? stored : null;
  } catch {
    // localStorage can throw in private-browsing/blocked-storage contexts —
    // fall back to the in-memory default rather than crashing the app.
    return null;
  }
}

function resolvePath(dict, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict);
}

/**
 * Multilingual dashboard preference (English / Hindi / Gujarati).
 *
 * Source of truth once logged in: `user.preferredLanguage` on the User
 * record (restored automatically on every login/session check via
 * AuthContext's getMe()). Before/without a session, falls back to
 * localStorage so a guest's last choice sticks across a refresh, and
 * finally to English.
 *
 * Switching language updates the UI immediately (no reload) and, when
 * authenticated, persists silently to the backend via the existing
 * PUT /api/auth/profile endpoint — same one the Profile page's other
 * settings already use.
 */
export function LanguageProvider({ children }) {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [language, setLanguageState] = useState(() => readStoredLanguage() || DEFAULT_LANGUAGE);

  // Whenever the authenticated user's stored preference is known (on
  // login, or on initial getMe() session restore), it takes priority
  // over whatever was in localStorage — this is what makes the
  // language "automatically restore" per-account on login.
  useEffect(() => {
    if (isAuthenticated && user?.preferredLanguage && SUPPORTED_CODES.includes(user.preferredLanguage)) {
      setLanguageState(user.preferredLanguage);
    }
  }, [isAuthenticated, user?.preferredLanguage]);

  const setLanguage = useCallback(
    async (code) => {
      if (!SUPPORTED_CODES.includes(code) || code === language) return;

      // Update the UI instantly rather than waiting on the network call.
      setLanguageState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // ignore storage errors — the in-memory state still updated
      }

      if (isAuthenticated) {
        try {
          // silent: the dropdown's own selected-state is the feedback;
          // a toast on every language switch would be noisy.
          await updateProfile({ preferredLanguage: code }, { silent: true });
        } catch {
          // Non-fatal: the dashboard already reflects the new language;
          // it just won't be remembered next login if this failed.
        }
      }
    },
    [language, isAuthenticated, updateProfile]
  );

  const t = useCallback(
    (key) => {
      const value =
        resolvePath(translations[language], key) ?? resolvePath(translations[DEFAULT_LANGUAGE], key);
      return value ?? key;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
