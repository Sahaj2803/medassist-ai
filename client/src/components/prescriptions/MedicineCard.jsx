import { useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineCheck, HiOutlinePencil, HiOutlineExclamationTriangle } from "react-icons/hi2";
import prescriptionService from "../../services/prescriptionService.js";
import AnalysisPanel from "../medicines/AnalysisPanel.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function MedicineCard({ prescriptionId, medicine, onUpdated }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: medicine.name || "",
    dosage: medicine.dosage || "",
    frequency: medicine.frequency || "",
    durationDays: medicine.durationDays ?? "",
    instructions: medicine.instructions || "",
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { medicine: updated } = await prescriptionService.updateMedicine(
        prescriptionId,
        medicine._id,
        {
          ...form,
          durationDays: form.durationDays === "" ? null : Number(form.durationDays),
        }
      );
      onUpdated(updated);
      setEditing(false);
      toast.success(t("prescriptions.medicineConfirmed"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("prescriptions.couldNotSave"));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="glass-panel space-y-3 p-5">
        <input
          value={form.name}
          onChange={handleChange("name")}
          placeholder={t("prescriptions.medicineName")}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.dosage}
            onChange={handleChange("dosage")}
            placeholder={t("prescriptions.dosage")}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
          <input
            value={form.frequency}
            onChange={handleChange("frequency")}
            placeholder={t("prescriptions.frequency")}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
          <input
            value={form.durationDays}
            onChange={handleChange("durationDays")}
            placeholder={t("prescriptions.durationDays")}
            type="number"
            min="0"
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
          <input
            value={form.instructions}
            onChange={handleChange("instructions")}
            placeholder={t("prescriptions.instructions")}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary !px-4 !py-2 text-sm"
          >
            {saving ? `${t("common.save")}…` : t("common.confirm")}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-panel flex flex-col gap-3 p-5 ${
        medicine.needsReview ? "border-amber-500/40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{medicine.name}</h3>
            {medicine.needsReview && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                <HiOutlineExclamationTriangle className="h-3.5 w-3.5" />
                {t("prescriptions.confirmThis")}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-mist-300">
            {[medicine.dosage, medicine.frequency, medicine.durationDays ? `${medicine.durationDays} ${t("common.days")}` : null]
              .filter(Boolean)
              .join(" · ") || t("prescriptions.noDosageDetails")}
          </p>
          {medicine.instructions && (
            <p className="mt-1 text-xs text-mist-400">{medicine.instructions}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-mist-200 hover:bg-white/5"
        >
          {medicine.confirmedByUser ? (
            <>
              <HiOutlineCheck className="h-3.5 w-3.5 text-signal-400" /> {t("prescriptions.confirmed")}
            </>
          ) : (
            <>
              <HiOutlinePencil className="h-3.5 w-3.5" /> {t("common.edit")}
            </>
          )}
        </button>
      </div>

      {!medicine.needsReview && (
        <AnalysisPanel medicine={medicine} onAnalyzed={onUpdated} />
      )}
    </div>
  );
}

export default MedicineCard;
