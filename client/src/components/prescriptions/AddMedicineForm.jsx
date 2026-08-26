import { useState } from "react";
import toast from "react-hot-toast";
import { HiOutlinePlus } from "react-icons/hi2";
import prescriptionService from "../../services/prescriptionService.js";
import { useLanguage } from "../../hooks/useLanguage.js";

function AddMedicineForm({ prescriptionId, onAdded }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", dosage: "", frequency: "", instructions: "" });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("prescriptions.medicineNameRequired"));
      return;
    }
    setSaving(true);
    try {
      const { medicine } = await prescriptionService.addMedicine(prescriptionId, form);
      onAdded(medicine);
      setForm({ name: "", dosage: "", frequency: "", instructions: "" });
      setOpen(false);
      toast.success(t("prescriptions.medicineAdded"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("prescriptions.couldNotAdd"));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary w-full justify-center"
      >
        <HiOutlinePlus className="h-4 w-4" />
        {t("prescriptions.addMissedMedicine")}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-3 p-5">
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
      </div>
      <input
        value={form.instructions}
        onChange={handleChange("instructions")}
        placeholder={t("prescriptions.instructionsExample")}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
      />
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="btn-primary !px-4 !py-2 text-sm">
          {saving ? t("prescriptions.adding") : t("prescriptions.addMedicine")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary !px-4 !py-2 text-sm"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}

export default AddMedicineForm;
