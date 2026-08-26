import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineDocumentText, HiOutlinePhoto, HiOutlinePlus } from "react-icons/hi2";
import prescriptionService from "../../services/prescriptionService.js";
import StatusBadge from "../../components/prescriptions/StatusBadge.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function PrescriptionHistoryPage() {
  const { t, language } = useLanguage();
  const [prescriptions, setPrescriptions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    prescriptionService
      .list()
      .then((data) => {
        if (!cancelled) setPrescriptions(data.prescriptions);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || t("prescriptions.couldNotLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="container-shell py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-eyebrow">{t("prescriptions.pageEyebrow")}</span>
          <h1 className="mt-3 text-3xl font-bold text-white">{t("prescriptions.yourPrescriptions")}</h1>
        </div>
        <Link to="/prescriptions/upload" className="btn-primary">
          <HiOutlinePlus className="h-4 w-4" />
          {t("common.uploadNew")}
        </Link>
      </div>

      {prescriptions.length === 0 ? (
        <div className="glass-panel mt-10 flex flex-col items-center gap-3 p-16 text-center">
          <HiOutlineDocumentText className="h-10 w-10 text-mist-400" />
          <h2 className="text-lg font-semibold text-white">{t("prescriptions.noPrescriptionsTitle")}</h2>
          <p className="max-w-sm text-sm text-mist-300">{t("prescriptions.noPrescriptionsBody")}</p>
          <Link to="/prescriptions/upload" className="btn-primary mt-2">
            {t("prescriptions.uploadPrescription")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((p) => {
            const count = p.medicines?.length || 0;
            const countLabel = t(
              count === 1 ? "prescriptions.medicinesDetectedCount" : "prescriptions.medicinesDetectedCountPlural"
            ).replace("{count}", count);
            return (
              <Link
                key={p._id}
                to={`/prescriptions/${p._id}`}
                className="glass-panel flex flex-col gap-3 p-5 transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between">
                  {p.fileType === "pdf" ? (
                    <HiOutlineDocumentText className="h-6 w-6 text-signal-400" />
                  ) : (
                    <HiOutlinePhoto className="h-6 w-6 text-signal-400" />
                  )}
                  <StatusBadge status={p.status} />
                </div>
                <p className="truncate text-sm font-medium text-white">{p.originalName}</p>
                <p className="text-xs text-mist-400">
                  {new Date(p.createdAt).toLocaleDateString(language, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-mist-400">{countLabel}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PrescriptionHistoryPage;
