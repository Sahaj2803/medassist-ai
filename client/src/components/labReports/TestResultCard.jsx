import ResultStatusBadge from "./ResultStatusBadge.jsx";
import TestExplanationPanel from "./TestExplanationPanel.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function TestResultCard({ result, compact = false }) {
  const { t } = useLanguage();
  return (
    <div className={compact ? "border-b border-white/5 py-3 last:border-0" : "glass-panel p-5"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-white">{result.testName}</h3>
        <ResultStatusBadge status={result.status} />
      </div>
      <p className="mt-1 text-sm text-mist-300">
        {[
          result.value
            ? `${result.value}${result.unit ? ` ${result.unit}` : ""}`
            : t("labReports.noValueRecorded"),
          result.referenceRange
            ? t("labReports.referenceLabel").replace("{range}", result.referenceRange)
            : t("labReports.noReferenceRangePrinted"),
        ].join(" · ")}
      </p>
      <TestExplanationPanel result={result} />
    </div>
  );
}

export default TestResultCard;
