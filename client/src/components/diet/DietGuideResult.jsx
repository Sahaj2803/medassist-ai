import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineBeaker,
  HiOutlineHeart,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import DietDisclaimer from "./DietDisclaimer.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-400">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BulletList({ items, empty }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-mist-400">{empty}</p>;
  }
  return (
    <ul className="space-y-1.5 text-sm text-mist-100">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Renders the structured guide object returned by the AI Gateway's
 * generateDietGuide() — see backend/ai/prompts/diet.prompt.js for the
 * exact shape. Every field is optional/defensive since it's AI output.
 * The AI itself generates guide.* strings in the user's preferred
 * language (see buildLanguageInstruction()); only these surrounding
 * section labels come from the static translation dictionary.
 */
function DietGuideResult({ dietGuide }) {
  const { t } = useLanguage();
  const guide = dietGuide?.guide || {};
  const meals = guide.mealGuidance || {};

  const MEAL_LABELS = {
    breakfast: t("diet.mealBreakfast"),
    lunch: t("diet.mealLunch"),
    snacks: t("diet.mealSnacks"),
    dinner: t("diet.mealDinner"),
  };

  const snapshotCount = dietGuide?.labReportSnapshot?.results?.length || 0;
  const snapshotLine =
    snapshotCount > 0
      ? t(snapshotCount === 1 ? "diet.basedInPartOneResult" : "diet.basedInPartManyResults")
          .replace("{labName}", dietGuide.labReportSnapshot.labName || t("diet.yourLabReport"))
          .replace("{count}", snapshotCount)
      : null;

  return (
    <div className="glass-panel-strong space-y-8 p-6 sm:p-8">
      <div>
        <div className="flex items-center gap-2">
          <HiOutlineHeart className="h-5 w-5 text-signal-400" />
          <h1 className="text-xl font-bold text-white">{t("diet.yourGuideTitle")}</h1>
        </div>
        {guide.overview && <p className="mt-2 text-sm leading-relaxed text-mist-100">{guide.overview}</p>}
      </div>

      {guide.healthConsiderations?.length > 0 && (
        <Section title={t("diet.healthConsiderations")}>
          <BulletList items={guide.healthConsiderations} />
        </Section>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Section title={t("diet.recommendedFoods")}>
          <div className="flex items-start gap-2">
            <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-signal-400" />
            <BulletList items={guide.recommendedFoods} empty={t("diet.recommendedFoodsEmpty")} />
          </div>
        </Section>
        <Section title={t("diet.foodsToLimit")}>
          <div className="flex items-start gap-2">
            <HiOutlineExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <BulletList items={guide.foodsToLimit} empty={t("diet.foodsToLimitEmpty")} />
          </div>
        </Section>
      </div>

      <Section title={t("diet.dailyMealGuidance")}>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(MEAL_LABELS).map(([key, label]) => (
            <div key={key} className="glass-panel p-4">
              <h3 className="text-sm font-semibold text-white">{label}</h3>
              <div className="mt-2">
                <BulletList items={meals[key]} empty={t("diet.mealSuggestionsEmpty")} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {guide.hydrationGuidance && (
        <Section title={t("diet.hydration")}>
          <p className="text-sm text-mist-100">{guide.hydrationGuidance}</p>
        </Section>
      )}

      {guide.lifestyleGuidance?.length > 0 && (
        <Section title={t("diet.lifestyleGuidance")}>
          <div className="flex items-start gap-2">
            <HiOutlineUserGroup className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
            <BulletList items={guide.lifestyleGuidance} />
          </div>
        </Section>
      )}

      {guide.importantNotes?.length > 0 && (
        <div className="glass-panel border-amber-500/30 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-amber-300">
            <HiOutlineExclamationTriangle className="h-4 w-4" />
            {t("diet.importantNotes")}
          </h2>
          <div className="mt-2">
            <BulletList items={guide.importantNotes} />
          </div>
        </div>
      )}

      {guide.doctorConsultation && (
        <Section title={t("diet.doctorConsultation")}>
          <p className="text-sm text-mist-100">{guide.doctorConsultation}</p>
        </Section>
      )}

      {snapshotLine && (
        <p className="flex items-center gap-1.5 text-xs text-mist-400">
          <HiOutlineBeaker className="h-3.5 w-3.5" />
          {snapshotLine}
        </p>
      )}

      <DietDisclaimer />
    </div>
  );
}

export default DietGuideResult;
