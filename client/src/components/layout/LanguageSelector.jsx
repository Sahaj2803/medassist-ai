import { useEffect, useRef, useState } from "react";
import { HiOutlineChevronDown, HiOutlineCheck } from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

/**
 * Compact "Language: [ English ▾ ]" dropdown for the navbar, near the
 * user's profile/avatar. Selecting a language updates the whole
 * dashboard's text immediately (LanguageContext) — no page reload.
 */
function LanguageSelector({ className = "" }) {
  const { language, setLanguage, languages, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.label")}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm font-medium text-mist-100 transition-colors hover:border-white/20 hover:bg-white/[0.08]"
      >
        <span aria-hidden="true">{current.flag}</span>
        <span className="hidden sm:inline">{current.nativeLabel}</span>
        <HiOutlineChevronDown
          className={`h-3.5 w-3.5 text-mist-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("language.label")}
          className="animate-dropdown-in absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-white/10 bg-ink-900/95 p-1.5 shadow-glass backdrop-blur-xl"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-mist-400">
            {t("language.label")}
          </p>
          {languages.map((lang) => {
            const selected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  selected
                    ? "bg-signal-500/15 text-signal-400"
                    : "text-mist-100 hover:bg-white/[0.06]"
                }`}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {selected && <HiOutlineCheck className="h-3.5 w-3.5" />}
                </span>
                <span aria-hidden="true">{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
