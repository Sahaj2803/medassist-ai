import { useEffect, useState } from "react";
import { HiOutlineSparkles, HiOutlineCheckCircle, HiOutlineExclamationTriangle } from "react-icons/hi2";
import healthInsightsService from "../../services/healthInsightsService.js";
import { useLanguage } from "../../hooks/useLanguage.js";

const LABEL_COLOR = {
  good: { ring: "#2DD4BF", text: "text-signal-400" },
  fair: { ring: "#F59E0B", text: "text-amber-400" },
  needs_attention: { ring: "#F43F5E", text: "text-alert-400" },
};

function ScoreRing({ score, overall }) {
  const color = LABEL_COLOR[overall]?.ring || "#2DD4BF";
  const angle = (score / 100) * 360;

  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg)`,
      }}
    >
      <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-ink-900">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-[10px] font-medium text-mist-400">/ 100</span>
      </div>
    </div>
  );
}

// Builds the localized sentence for one structured finding returned by
// healthScoreService.getHealthScore() — see that file's comment for why
// it returns codes/counts (e.g. { key: "labs_need_attention", attentionCount,
// totalCount }) instead of pre-built English text. Every sentence here
// comes from the current language's translation dictionary.
function useFindingText() {
  const { t } = useLanguage();
  return (finding) => {
    switch (finding.key) {
      case "labs_all_within_range":
        return t("healthScore.labsAllWithinRange");
      case "labs_need_attention":
        return t("healthScore.labsNeedAttention")
          .replace("{attention}", finding.attentionCount)
          .replace("{total}", finding.totalCount);
      case "no_interactions":
        return t("healthScore.noInteractionsDetected");
      case "interactions_flagged": {
        const parts = [];
        if (finding.severe) parts.push(t("healthScore.severeCount").replace("{count}", finding.severe));
        if (finding.moderate) parts.push(t("healthScore.moderateCount").replace("{count}", finding.moderate));
        if (finding.mild) parts.push(t("healthScore.mildCount").replace("{count}", finding.mild));
        return t("healthScore.interactionsFlagged").replace("{parts}", parts.join(", "));
      }
      case "good_adherence":
        return t("healthScore.goodAdherence")
          .replace("{score}", finding.score)
          .replace("{taken}", finding.taken)
          .replace("{resolved}", finding.resolved);
      case "low_adherence":
        return t(finding.missed === 1 ? "healthScore.lowAdherenceOne" : "healthScore.lowAdherenceMany")
          .replace("{score}", finding.score)
          .replace("{missed}", finding.missed);
      default:
        return null;
    }
  };
}

function useExplanationText() {
  const { t } = useLanguage();
  return (sources) => {
    const parts = [];
    if (sources.labReportsCount > 0) {
      parts.push(
        t(sources.labReportsCount === 1 ? "healthScore.oneLabReport" : "healthScore.manyLabReports").replace(
          "{count}",
          sources.labReportsCount
        )
      );
    }
    if (sources.analyzedPrescriptionsCount > 0) {
      parts.push(
        t(
          sources.analyzedPrescriptionsCount === 1
            ? "healthScore.oneAnalyzedPrescription"
            : "healthScore.manyAnalyzedPrescriptions"
        ).replace("{count}", sources.analyzedPrescriptionsCount)
      );
    }
    if (sources.hasAdherenceHistory) parts.push(t("healthScore.yourReminderHistory"));
    return `${t("healthScore.explanationPrefix")} ${parts.join(", ")} ${t("healthScore.explanationSuffix")}`;
  };
}

function HealthScoreCard() {
  const { t, language } = useLanguage();
  const findingText = useFindingText();
  const explanationText = useExplanationText();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    healthInsightsService
      .score()
      .then((res) => setData(res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) {
    return (
      <div className="glass-panel-strong flex items-center justify-center p-8">
        <p className="text-sm text-mist-400">{t("healthScore.generating")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel-strong flex flex-col items-center gap-3 p-8 text-center">
        <HiOutlineExclamationTriangle className="h-6 w-6 text-alert-400" />
        <p className="text-sm text-mist-300">{t("healthScore.couldNotLoad")}</p>
        <button type="button" onClick={load} className="btn-secondary !px-4 !py-2 text-sm">
          {t("healthScore.retry")}
        </button>
      </div>
    );
  }

  if (!data?.available) {
    return (
      <div className="glass-panel-strong flex flex-col items-center gap-2 p-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
          <HiOutlineSparkles className="h-5 w-5 text-white" />
        </span>
        <h3 className="text-sm font-semibold text-white">{t("healthScore.cardTitle")}</h3>
        <p className="max-w-xs text-sm text-mist-300">{t("healthScore.notEnoughData")}</p>
      </div>
    );
  }

  const color = LABEL_COLOR[data.overall] || LABEL_COLOR.good;
  const OVERALL_LABEL_KEY = {
    good: "overallGood",
    fair: "overallFair",
    needs_attention: "overallNeedsAttention",
  };

  return (
    <div className="glass-panel-strong p-6">
      <div className="flex items-center gap-2">
        <HiOutlineSparkles className="h-4 w-4 text-signal-400" />
        <span className="section-eyebrow">{t("healthScore.cardTitle")}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-6">
        <ScoreRing score={data.score} overall={data.overall} />
        <div className="min-w-0">
          <p className={`text-lg font-bold ${color.text}`}>
            {t(`healthScore.${OVERALL_LABEL_KEY[data.overall] || "overallGood"}`)}
          </p>
          <p className="mt-1 text-xs text-mist-400">{explanationText(data.sources)}</p>
          <p className="mt-1 text-[11px] text-mist-500">
            {t("healthScore.lastUpdated").replace(
              "{date}",
              new Date(data.generatedAt).toLocaleDateString(language)
            )}
          </p>
        </div>
      </div>

      {(data.positives?.length > 0 || data.needsAttention?.length > 0) && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {data.positives?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-signal-400">
                <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                {t("healthScore.positiveIndicators")}
              </p>
              <ul className="mt-2 space-y-1.5">
                {data.positives.map((p, i) => (
                  <li key={i} className="text-xs text-mist-300">
                    {findingText(p)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.needsAttention?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
                <HiOutlineExclamationTriangle className="h-3.5 w-3.5" />
                {t("healthScore.mayNeedAttention")}
              </p>
              <ul className="mt-2 space-y-1.5">
                {data.needsAttention.map((n, i) => (
                  <li key={i} className="text-xs text-mist-300">
                    {findingText(n)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="mt-5 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-mist-500">
        {t("healthScore.disclaimer")}
      </p>
    </div>
  );
}

export default HealthScoreCard;
