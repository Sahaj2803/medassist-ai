import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineBeaker } from "react-icons/hi2";
import medicineService from "../../services/medicineService.js";
import AnalysisPanel from "../../components/medicines/AnalysisPanel.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function MedicineLibraryPage() {
  const { t } = useLanguage();
  const [medicines, setMedicines] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    medicineService
      .list()
      .then((data) => {
        if (!cancelled) setMedicines(data.medicines);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || t("medicines.couldNotLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyzed = (updated) => {
    setMedicines((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="container-shell py-16">
      <span className="section-eyebrow">{t("medicines.pageEyebrow")}</span>
      <h1 className="mt-3 text-3xl font-bold text-white">{t("medicines.allMedicines")}</h1>
      <p className="mt-2 max-w-xl text-mist-300">{t("medicines.pageDescription")}</p>

      {medicines.length === 0 ? (
        <div className="glass-panel mt-10 flex flex-col items-center gap-3 p-16 text-center">
          <HiOutlineBeaker className="h-10 w-10 text-mist-400" />
          <h2 className="text-lg font-semibold text-white">{t("medicines.noMedicinesTitle")}</h2>
          <p className="max-w-sm text-sm text-mist-300">{t("medicines.noMedicinesBody")}</p>
          <Link to="/prescriptions/upload" className="btn-primary mt-2">
            {t("prescriptions.uploadPrescription")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {medicines.map((medicine) => (
            <div key={medicine._id} className="glass-panel flex flex-col gap-3 p-5">
              <div>
                <h3 className="font-semibold text-white">{medicine.name}</h3>
                <p className="mt-1 text-sm text-mist-300">
                  {[
                    medicine.dosage,
                    medicine.frequency,
                    medicine.durationDays ? `${medicine.durationDays} ${t("common.days")}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || t("medicines.noDosageDetails")}
                </p>
              </div>
              {!medicine.needsReview && (
                <AnalysisPanel medicine={medicine} onAnalyzed={handleAnalyzed} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MedicineLibraryPage;
