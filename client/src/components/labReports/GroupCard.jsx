import { useState } from "react";
import { HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi2";
import TestResultCard from "./TestResultCard.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

// Dynamic AI-generated group names are matched against these keywords
// for a fitting icon; anything unmatched falls back to a neutral one.
// Purely decorative — grouping logic itself never depends on this list.
const GROUP_ICONS = [
  { match: /blood count|cbc|hemat/i, icon: "🩸" },
  { match: /glucose|diabet|sugar|hba1c/i, icon: "🍬" },
  { match: /kidney|renal/i, icon: "🧪" },
  { match: /liver|hepatic/i, icon: "🧫" },
  { match: /lipid|cholesterol/i, icon: "🫀" },
  { match: /thyroid/i, icon: "⚙️" },
  { match: /vitamin/i, icon: "☀️" },
  { match: /electrolyte/i, icon: "⚡" },
  { match: /urine|urinalysis/i, icon: "🧴" },
];

function groupIcon(name) {
  return GROUP_ICONS.find((g) => g.match.test(name))?.icon || "🧬";
}

function GroupCard({ group, resultsByName }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const tests = group.testNames.map((name) => resultsByName[name]).filter(Boolean);

  if (tests.length === 0) return null;

  return (
    <div className="glass-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="text-base">{groupIcon(group.name)}</span>
          {group.name.toUpperCase()}
        </span>
        <span className="flex items-center gap-3">
          <span className="text-xs font-medium text-mist-400">
            {tests.length === 1
              ? t("labReports.testsCountOne")
              : t("labReports.testsCountMany").replace("{count}", tests.length)}
          </span>
          {expanded ? (
            <HiOutlineChevronUp className="h-4 w-4 text-mist-400" />
          ) : (
            <HiOutlineChevronDown className="h-4 w-4 text-mist-400" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-5 pb-2">
          {tests.map((r) => (
            <TestResultCard key={r.testName} result={r} compact />
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupCard;
