import { HiOutlineInformationCircle } from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

/**
 * Small, non-intrusive medical disclaimer shown wherever a diet guide
 * is displayed. Text matches the wording used across MedAssist's other
 * AI features (lab report analyzer, chatbot) for consistency.
 */
function DietDisclaimer() {
  const { t } = useLanguage();
  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs leading-relaxed text-mist-400">
      <HiOutlineInformationCircle className="mt-0.5 h-4 w-4 shrink-0 text-mist-400" />
      <p>{t("diet.disclaimer")}</p>
    </div>
  );
}

export default DietDisclaimer;
