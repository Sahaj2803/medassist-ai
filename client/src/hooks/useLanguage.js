import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext.jsx";

/**
 * Access the current dashboard language, the setLanguage(code) setter,
 * and the t(key) translation lookup helper from any component.
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export default useLanguage;
