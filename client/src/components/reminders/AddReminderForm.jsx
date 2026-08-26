import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2";
import medicineService from "../../services/medicineService.js";
import reminderService from "../../services/reminderService.js";
import { useLanguage } from "../../hooks/useLanguage.js";

const emptyForm = {
  medicineId: "",
  medicineName: "",
  dosage: "",
  times: ["09:00"],
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  channelEmail: true,
  channelBrowser: true,
};

function AddReminderForm({ onCreated }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    medicineService
      .list()
      .then(({ medicines: data }) => setMedicines(data.filter((m) => !m.needsReview)))
      .catch(() => setMedicines([]));
  }, [open]);

  const handleMedicineSelect = (e) => {
    const id = e.target.value;
    const picked = medicines.find((m) => m._id === id);
    setForm((prev) => ({
      ...prev,
      medicineId: id,
      medicineName: picked ? picked.name : prev.medicineName,
      dosage: picked?.dosage || prev.dosage,
    }));
  };

  const handleTimeChange = (index, value) => {
    setForm((prev) => ({
      ...prev,
      times: prev.times.map((t, i) => (i === index ? value : t)),
    }));
  };

  const addTimeSlot = () => {
    setForm((prev) => ({ ...prev, times: [...prev.times, "09:00"] }));
  };

  const removeTimeSlot = (index) => {
    setForm((prev) => ({ ...prev, times: prev.times.filter((_, i) => i !== index) }));
  };

  const reset = () => {
    setForm(emptyForm);
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.medicineName.trim()) {
      toast.error(t("reminders.chooseMedicineOrName"));
      return;
    }
    if (form.times.length === 0) {
      toast.error(t("reminders.addAtLeastOneTime"));
      return;
    }

    setSaving(true);
    try {
      const { reminder } = await reminderService.create({
        medicineId: form.medicineId || undefined,
        medicineName: form.medicineName.trim(),
        dosage: form.dosage || undefined,
        times: form.times,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        channels: { email: form.channelEmail, browser: form.channelBrowser },
      });
      toast.success(t("reminders.reminderCreated"));
      onCreated(reminder);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || t("reminders.couldNotCreate"));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <HiOutlinePlus className="h-4 w-4" />
        {t("reminders.addReminder")}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{t("reminders.newReminder")}</h3>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg p-1 text-mist-400 hover:bg-white/5"
          aria-label={t("reminders.cancel")}
        >
          <HiOutlineXMark className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-mist-300">
          {t("reminders.medicineOptionalLabel")}
        </label>
        <select
          value={form.medicineId}
          onChange={handleMedicineSelect}
          className="dark-select w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white focus:border-signal-400 focus:outline-none"
        >
          <option value="">{t("reminders.chooseFromMedicines")}</option>
          {medicines.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
              {m.dosage ? ` (${m.dosage})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-mist-300">{t("reminders.medicineName")}</label>
          <input
            value={form.medicineName}
            onChange={(e) => setForm((p) => ({ ...p, medicineName: e.target.value }))}
            placeholder={t("reminders.medicineNamePlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-mist-300">{t("reminders.dosage")}</label>
          <input
            value={form.dosage}
            onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))}
            placeholder={t("reminders.dosagePlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-mist-300">
          {t("reminders.reminderTimesDaily")}
        </label>
        <div className="space-y-2">
          {form.times.map((time, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(i, e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-signal-400 focus:outline-none"
              />
              {form.times.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTimeSlot(i)}
                  className="rounded-lg p-2 text-mist-400 hover:bg-white/5 hover:text-alert-400"
                  aria-label={t("reminders.removeTime")}
                >
                  <HiOutlineXMark className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTimeSlot}
          className="mt-2 text-xs font-medium text-signal-400 hover:text-signal-500"
        >
          {t("reminders.addAnotherTime")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-mist-300">{t("reminders.startDate")}</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-signal-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-mist-300">
            {t("reminders.endDateOptional")}
          </label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-signal-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-mist-300">{t("reminders.notifyMeVia")}</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-mist-200">
            <input
              type="checkbox"
              checked={form.channelEmail}
              onChange={(e) => setForm((p) => ({ ...p, channelEmail: e.target.checked }))}
              className="rounded border-white/20 bg-white/5 text-signal-500 focus:ring-signal-400"
            />
            {t("reminders.email")}
          </label>
          <label className="flex items-center gap-2 text-sm text-mist-200">
            <input
              type="checkbox"
              checked={form.channelBrowser}
              onChange={(e) => setForm((p) => ({ ...p, channelBrowser: e.target.checked }))}
              className="rounded border-white/20 bg-white/5 text-signal-500 focus:ring-signal-400"
            />
            {t("reminders.browserNotification")}
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="btn-primary !px-4 !py-2 text-sm">
          {saving ? t("reminders.creating") : t("reminders.createReminder")}
        </button>
        <button type="button" onClick={reset} className="btn-secondary !px-4 !py-2 text-sm">
          {t("reminders.cancel")}
        </button>
      </div>
    </form>
  );
}

export default AddReminderForm;
