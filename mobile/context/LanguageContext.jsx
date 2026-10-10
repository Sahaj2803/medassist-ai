import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { languageStore as store } from "../i18n/runtime";
import { translate } from "../i18n";
import { SUPPORTED_LANGUAGES } from "../constants/config";

const LanguageContext = createContext(null);

/**
 * Must wrap AuthProvider (AuthProvider calls applyAccountLanguage). It does not import AuthContext, so there is no cycle.
 */
export function LanguageProvider({ children }) {
  const { language, ready } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    store.init();
  }, []);

  const t = useCallback((key, params) => translate(language, key, params), [language]);

  const value = useMemo(
    () => ({
      language,
      isReady: ready,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
      // Stable references (store methods never change).
      setLanguage: store.setLanguage,
      applyAccountLanguage: store.applyAccountLanguage,
    }),
    [language, ready, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage() must be used within a <LanguageProvider>");
  }
  return ctx;
}

/** Convenience for screens that only need to translate. */
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}

export default LanguageProvider;
