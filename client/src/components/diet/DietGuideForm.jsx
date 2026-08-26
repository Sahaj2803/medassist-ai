import { useEffect, useState } from "react";
import { HiOutlineBeaker, HiOutlineSparkles } from "react-icons/hi2";
import dietService from "../../services/dietService.js";
import { useLanguage } from "../../hooks/useLanguage.js";

const emptyForm = {
  labReportId: "",
  age: "",
  gender: "",
  activityLevel: "",
  conditions: "",
  symptoms: "",
  dietaryRestrictions: "",
  allergies: "",
  dietaryPreferences: "",
  medications: "",
};

/**
 * Health-information + lab-report-selection form for generating a new
 * AI Personalized Medical Diet Guide. Every field is optional except
 * that at least one of "select a lab report" / "fill something in" is
 * required — enforced server-side too, so this is just a UX nicety.
 */
function DietGuideForm({ onGenerated }) {
  const { t, language } = useLanguage();
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const ACTIVITY_LEVELS = [
    { value: "", label: t("diet.activityNotSpecified") },
    { value: "sedentary", label: t("diet.activitySedentary") },
    { value: "light", label: t("diet.activityLight") },
    { value: "moderate", label: t("diet.activityModerate") },
    { value: "active", label: t("diet.activityActive") },
    { value: "very_active", label: t("diet.activityVeryActive") },
  ];

  useEffect(() => {
    dietService
      .context()
      .then((data) => {
        setContext(data);
        // Pre-fill medications from the user's own confirmed medicines
        // so they don't have to retype something the app already knows
        // — still fully editable/removable before generating.
        if (data.medicines?.length) {
          setForm((prev) => ({
            ...prev,
            medications: data.medicines.map((m) => m.name).join(", "),
          }));
        }
      })
      .catch(() => setContext({ labReports: [], medicines: [] }))
      .finally(() => setContextLoading(false));
  }, []);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const hasManualInfo = [
      form.age,
      form.gender,
      form.activityLevel,
      form.conditions,
      form.symptoms,
      form.dietaryRestrictions,
      form.allergies,
      form.dietaryPreferences,
      form.medications,
    ].some((v) => v && v.trim());

    if (!form.labReportId && !hasManualInfo) {
      setError(t("diet.selectOrFillError"));
      return;
    }

    setGenerating(true);
    try {
      const { dietGuide } = await dietService.generate({
        labReportId: form.labReportId || undefined,
        age: form.age || undefined,
        gender: form.gender || undefined,
        activityLevel: form.activityLevel || undefined,
        conditions: form.conditions,
        symptoms: form.symptoms,
        dietaryRestrictions: form.dietaryRestrictions,
        allergies: form.allergies,
        dietaryPreferences: form.dietaryPreferences,
        medications: form.medications,
      });
      onGenerated(dietGuide);
    } catch (err) {
      setError(err.response?.data?.message || t("diet.generateFailed"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-6 p-6">
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-mist-100">
          <HiOutlineBeaker className="h-4 w-4 text-signal-400" />
          {t("diet.selectLabReport")}
        </label>
        {contextLoading ? (
          <p className="text-sm text-mist-400">{t("diet.loadingLabReports")}</p>
        ) : (
          <select
            value={form.labReportId}
            onChange={update("labReportId")}
            className="dark-select w-full rounded-lg border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-white focus:border-signal-400 focus:outline-none"
          >
            <option value="">{t("diet.noLabReportOption")}</option>
            {context?.labReports?.map((r) => (
              <option key={r._id} value={r._id}>
                {t("diet.labReportOptionLabel")
                  .replace("{name}", r.labName || t("diet.labReportDefaultName"))
                  .replace("{date}", new Date(r.reportDate || r.createdAt).toLocaleDateString(language))
                  .replace("{count}", r.resultCount)}
              </option>
            ))}
          </select>
        )}
        {context?.labReports?.length === 0 && !contextLoading && (
          <p className="mt-1.5 text-xs text-mist-400">{t("diet.noLabReportsNote")}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-mist-100">
            {t("diet.age")}
          </label>
          <input
            id="age"
            type="number"
            min="0"
            max="130"
            value={form.age}
            onChange={update("age")}
            placeholder={t("diet.agePlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="gender" className="mb-1.5 block text-sm font-medium text-mist-100">
            {t("diet.genderSex")}
          </label>
          <input
            id="gender"
            type="text"
            value={form.gender}
            onChange={update("gender")}
            placeholder={t("diet.optional")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="activityLevel" className="mb-1.5 block text-sm font-medium text-mist-100">
            {t("diet.activityLevel")}
          </label>
          <select
            id="activityLevel"
            value={form.activityLevel}
            onChange={update("activityLevel")}
            className="dark-select w-full rounded-lg border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-white focus:border-signal-400 focus:outline-none"
          >
            {ACTIVITY_LEVELS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="conditions" className="mb-1.5 block text-sm font-medium text-mist-100">
            {t("diet.existingConditions")}
          </label>
          <input
            id="conditions"
            type="text"
            value={form.conditions}
            onChange={update("conditions")}
            placeholder={t("diet.conditionsPlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="symptoms" className="mb-1.5 block text-sm font-medium text-mist-100">
            {t("diet.relevantSymptoms")}
          </label>
          <input
            id="symptoms"
            type="text"
            value={form.symptoms}
            onChange={update("symptoms")}
            placeholder={t("diet.symptomsPlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="allergies" className="mb-1.5 block text-sm font-medium text-mist-100">
            {t("diet.foodAllergies")}
          </label>
          <input
            id="allergies"
            type="text"
            value={form.allergies}
            onChange={update("allergies")}
            placeholder={t("diet.allergiesPlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="dietaryRestrictions" className="mb-1.5 block text-sm font-medium text-mist-100">
            {t("diet.dietaryRestrictions")}
          </label>
          <input
            id="dietaryRestrictions"
            type="text"
            value={form.dietaryRestrictions}
            onChange={update("dietaryRestrictions")}
            placeholder={t("diet.restrictionsPlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="dietaryPreferences" className="mb-1.5 block text-sm font-medium text-mist-100">
            {t("diet.dietaryPreferences")}
          </label>
          <input
            id="dietaryPreferences"
            type="text"
            value={form.dietaryPreferences}
            onChange={update("dietaryPreferences")}
            placeholder={t("diet.preferencesPlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="medications" className="mb-1.5 block text-sm font-medium text-mist-100">
            {t("diet.currentMedications")}
          </label>
          <input
            id="medications"
            type="text"
            value={form.medications}
            onChange={update("medications")}
            placeholder={t("diet.medicationsPlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
      </div>

      <p className="text-xs text-mist-400">{t("diet.formHint")}</p>

      {error && <p className="text-sm text-alert-400">{error}</p>}

      <button type="submit" disabled={generating} className="btn-primary w-full sm:w-auto">
        <HiOutlineSparkles className="h-4 w-4" />
        {generating ? t("diet.generating") : t("diet.generateDietGuide")}
      </button>
    </form>
  );
}

export default DietGuideForm;
