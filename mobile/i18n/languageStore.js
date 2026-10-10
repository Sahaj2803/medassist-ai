// Framework-free language state holder. LanguageContext.jsx wraps this with
// useSyncExternalStore; keeping the logic here makes the race-condition rules
// testable without a React renderer.
//
// Rules:
//  * Language is always a supported code (invalid input is rejected/normalised).
//  * A change made by the app (user pick, account restore, reset) ALWAYS wins
//    over a slower stored-value read from startup (`seq` guard), so a valid
//    choice is never overwritten by stale storage or by the English default.
//  * Persistence writes are serialised, so the last change is the one stored.
//  * Storage failures never break the UI; state is in-memory first.
import { DEFAULT_LANGUAGE, isSupportedLanguage, normalizeLanguage } from "./index.js";

export function createLanguageStore({ storage } = {}) {
  let state = { language: DEFAULT_LANGUAGE, ready: false };
  let seq = 0;
  let initPromise = null;
  let writeQueue = Promise.resolve();
  const listeners = new Set();

  const emit = (next) => {
    if (next.language === state.language && next.ready === state.ready) return;
    state = next;
    listeners.forEach((l) => l());
  };

  const enqueue = (fn) => {
    writeQueue = writeQueue.then(fn).catch(() => {});
    return writeQueue;
  };

  const commit = (language) => {
    seq += 1;
    emit({ ...state, language });
    return enqueue(() => storage?.set(language));
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,

    /** Restore the locally stored language once. Safe to call repeatedly. */
    init() {
      if (initPromise) return initPromise;
      const seqAtStart = seq;
      initPromise = (async () => {
        let stored = null;
        try {
          stored = storage ? await storage.get() : null;
        } catch {
          stored = null;
        }
        if (seq === seqAtStart && isSupportedLanguage(stored)) {
          emit({ language: stored, ready: true });
        } else {
          emit({ ...state, ready: true });
        }
      })();
      return initPromise;
    },

    /** User-initiated change. Returns false (and changes nothing) for an unsupported code. */
    async setLanguage(code) {
      if (!isSupportedLanguage(code)) return false;
      await commit(code);
      return true;
    },

    /**
     * Account language from the server. A missing/invalid value is treated as
     * the documented fallback (English) rather than keeping whatever the
     * previous account or device had.
     */
    async applyAccountLanguage(code) {
      const language = normalizeLanguage(code);
      await commit(language);
      return language;
    },
  };
}

export default createLanguageStore;
