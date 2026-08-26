import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineBellAlert } from "react-icons/hi2";
import reminderService from "../../services/reminderService.js";
import OccurrenceRow from "../../components/reminders/OccurrenceRow.jsx";
import StatCard from "../../components/reminders/StatCard.jsx";
import AddReminderForm from "../../components/reminders/AddReminderForm.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function RemindersPage() {
  const { t } = useLanguage();
  const [occurrences, setOccurrences] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadToday = async () => {
    try {
      const { occurrences: data } = await reminderService.today();
      setOccurrences(data);
    } catch (err) {
      toast.error(err.response?.data?.message || t("reminders.couldNotLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMark = async (occurrence, status) => {
    try {
      await reminderService.mark(occurrence.reminderId, occurrence.scheduledFor, status);
      setOccurrences((prev) =>
        prev.map((o) =>
          o.reminderId === occurrence.reminderId && o.scheduledFor === occurrence.scheduledFor
            ? { ...o, status }
            : o
        )
      );
      toast.success(status === "taken" ? t("reminders.markedTaken") : t("reminders.markedMissed"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("reminders.couldNotUpdate"));
    }
  };

  const handleReminderCreated = () => {
    setLoading(true);
    loadToday();
  };

  const handleDelete = async (occurrence) => {
    if (!window.confirm(t("reminders.deleteConfirm").replace("{name}", occurrence.medicineName))) return;
    try {
      await reminderService.remove(occurrence.reminderId);
      setOccurrences((prev) => prev.filter((o) => o.reminderId !== occurrence.reminderId));
      toast.success(t("reminders.deletedToastSuccess"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("reminders.couldNotDelete"));
    }
  };

  if (loading) return <PageLoader />;

  const upcoming = occurrences.filter((o) => o.status === "pending" || o.status === "due");
  const missed = occurrences.filter((o) => o.status === "missed");
  const taken = occurrences.filter((o) => o.status === "taken");

  return (
    <div className="container-shell py-16">
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="section-eyebrow">{t("reminders.pageEyebrow")}</span>
          <h1 className="mt-3 text-3xl font-bold text-white">{t("reminders.todaysMedicines")}</h1>
          <p className="mt-2 text-mist-300">{t("reminders.pageDescription")}</p>
        </div>
      </div>

      <div className="mt-6">
        <AddReminderForm onCreated={handleReminderCreated} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("reminders.statUpcoming")} value={upcoming.length} accent="text-brand-300" />
        <StatCard label={t("reminders.statTaken")} value={taken.length} accent="text-signal-400" />
        <StatCard label={t("reminders.statMissed")} value={missed.length} accent="text-alert-400" />
      </div>

      {occurrences.length === 0 ? (
        <div className="glass-panel mt-10 flex flex-col items-center gap-3 p-16 text-center">
          <HiOutlineBellAlert className="h-10 w-10 text-mist-400" />
          <h2 className="text-lg font-semibold text-white">{t("reminders.noneScheduledTitle")}</h2>
          <p className="max-w-sm text-sm text-mist-300">{t("reminders.noneScheduledBody")}</p>
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mist-400">
                {t("reminders.sectionUpcoming")}
              </h2>
              <div className="space-y-2">
                {upcoming.map((o) => (
                  <OccurrenceRow
                    key={`${o.reminderId}-${o.scheduledFor}`}
                    occurrence={o}
                    onMark={handleMark}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {missed.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mist-400">
                {t("reminders.sectionMissed")}
              </h2>
              <div className="space-y-2">
                {missed.map((o) => (
                  <OccurrenceRow
                    key={`${o.reminderId}-${o.scheduledFor}`}
                    occurrence={o}
                    onMark={handleMark}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {taken.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mist-400">
                {t("reminders.sectionCompleted")}
              </h2>
              <div className="space-y-2">
                {taken.map((o) => (
                  <OccurrenceRow
                    key={`${o.reminderId}-${o.scheduledFor}`}
                    occurrence={o}
                    onMark={handleMark}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RemindersPage;
