import { useState } from "react";
import { HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

function Section({ label, text }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-mist-400">{label}</p>
      <p className="mt-1 text-sm text-mist-200">{text}</p>
    </div>
  );
}

/**
 * Purely a viewer — there's no per-test "analyze" trigger here on
 * purpose. The whole report is explained in one Groq call (see the
 * report-level "Analyze with AI" button), never one request per test,
 * to stay within free-tier AI rate limits on reports with many results.
 */
function TestExplanationPanel({ result }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const explanation = result.explanation;

  if (!explanation) return null;

  const resultLine =
    [result.value, result.unit].filter(Boolean).join(" ") || t("labReports.notRecorded");

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-signal-400"
      >
        <span>🔍 {t("labReports.whatDoesThisMean")}</span>
        {expanded ? (
          <HiOutlineChevronUp className="h-3.5 w-3.5" />
        ) : (
          <HiOutlineChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-white/10 px-3 py-3">
          <Section
            label={t("labReports.whatIsThisTest").replace("{testName}", result.testName)}
            text={explanation.whatItMeasures}
          />
          <Section label={t("labReports.whyGenerallyTested")} text={explanation.whyItMatters} />
          <Section label={t("labReports.yourResult")} text={resultLine} />
          <Section
            label={t("labReports.referenceRange")}
            text={result.referenceRange || t("labReports.notPrintedOnReport")}
          />
          <Section label={t("labReports.interpretation")} text={explanation.interpretation} />
          {explanation.simpleExplanation &&
            explanation.simpleExplanation !== explanation.whatItMeasures && (
              <p className="border-t border-white/10 pt-2 text-xs italic text-mist-400">
                {explanation.simpleExplanation}
              </p>
            )}
        </div>
      )}
    </div>
  );
}

export default TestExplanationPanel;
