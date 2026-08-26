import { HiOutlineExclamationTriangle, HiOutlineShieldCheck } from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

function useSeverityStyles() {
  const { t } = useLanguage();
  return {
    severe: {
      border: "border-alert-500/40",
      bg: "bg-alert-500/10",
      text: "text-alert-400",
      label: t("interactions.severitySevere"),
    },
    moderate: {
      border: "border-amber-500/40",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      label: t("interactions.severityModerate"),
    },
    mild: {
      border: "border-brand-500/40",
      bg: "bg-brand-500/10",
      text: "text-brand-300",
      label: t("interactions.severityMild"),
    },
  };
}

function InteractionAlert({ interactions, checkedAt }) {
  const { t } = useLanguage();
  const SEVERITY_STYLES = useSeverityStyles();
  if (!checkedAt) return null;

  if (interactions.length === 0) {
    return (
      <div className="glass-panel flex items-center gap-3 border-signal-500/30 p-4">
        <HiOutlineShieldCheck className="h-5 w-5 shrink-0 text-signal-400" />
        <p className="text-sm text-mist-200">{t("interactions.noInteractions")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {interactions.map((interaction, i) => {
        const style = SEVERITY_STYLES[interaction.severity] || SEVERITY_STYLES.mild;
        return (
          <div
            key={`${interaction.medicineA}-${interaction.medicineB}-${i}`}
            className={`glass-panel flex items-start gap-3 p-4 ${style.border}`}
          >
            <HiOutlineExclamationTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${style.text}`} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">
                  {interaction.medicineA} + {interaction.medicineB}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.bg} ${style.text}`}
                >
                  {style.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-mist-300">{interaction.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default InteractionAlert;
