import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles,
} from "react-icons/hi2";
import prescriptionService from "../../services/prescriptionService.js";
import StatusBadge from "../../components/prescriptions/StatusBadge.jsx";
import MedicineCard from "../../components/prescriptions/MedicineCard.jsx";
import AddMedicineForm from "../../components/prescriptions/AddMedicineForm.jsx";
import InteractionAlert from "../../components/medicines/InteractionAlert.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function PrescriptionDetailPage() {
  const { t, language } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    let cancelled = false;
    prescriptionService
      .getById(id)
      .then((data) => {
        if (!cancelled) setPrescription(data.prescription);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || t("prescriptions.notFoundToast"));
        navigate("/prescriptions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleMedicineUpdated = (updated) => {
    setPrescription((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) => (m._id === updated._id ? updated : m)),
      status: prev.medicines.every((m) => m._id === updated._id || !m.needsReview)
        ? "processed"
        : prev.status,
    }));
  };

  const handleMedicineAdded = (medicine) => {
    setPrescription((prev) => ({ ...prev, medicines: [...prev.medicines, medicine] }));
  };

  const handleDelete = async () => {
    if (!window.confirm(t("prescriptions.deleteConfirm"))) return;
    try {
      await prescriptionService.remove(id);
      toast.success(t("prescriptions.deletedToastSuccess"));
      navigate("/prescriptions");
    } catch (err) {
      toast.error(err.response?.data?.message || t("prescriptions.couldNotDelete"));
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { prescription: updated, aiSummary: summary } = await prescriptionService.analyze(id);
      setPrescription(updated);
      setAiSummary(summary || null);
      toast.success(t("prescriptions.analysisComplete"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("prescriptions.analysisFailed"));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!prescription) return null;

  const needsReviewCount = prescription.medicines.filter((m) => m.needsReview).length;

  return (
    <div className="container-shell max-w-4xl py-16">
      <button
        type="button"
        onClick={() => navigate("/prescriptions")}
        className="flex items-center gap-1.5 text-sm text-mist-400 hover:text-white"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        {t("prescriptions.backToHistory")}
      </button>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{prescription.originalName}</h1>
            <StatusBadge status={prescription.status} />
          </div>
          <p className="mt-1 text-sm text-mist-400">
            {t("prescriptions.uploadedOn").replace(
              "{date}",
              new Date(prescription.createdAt).toLocaleString(language)
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            <HiOutlineSparkles className="h-4 w-4 text-signal-400" />
            {analyzing ? t("common.analyzing") : t("common.analyzeWithAi")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-lg border border-alert-500/30 px-3 py-2 text-sm text-alert-400 hover:bg-alert-500/10"
          >
            <HiOutlineTrash className="h-4 w-4" />
            {t("common.delete")}
          </button>
        </div>
      </div>

      {aiSummary && (
        <div className="glass-panel mt-6 flex items-start gap-3 border-signal-500/30 p-5">
          <HiOutlineSparkles className="mt-0.5 h-5 w-5 shrink-0 text-signal-400" />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-400">
              {t("prescriptions.aiSummaryTitle")}
            </h2>
            <p className="mt-2 text-sm text-mist-200">{aiSummary}</p>
          </div>
        </div>
      )}

      {prescription.interactionsCheckedAt && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mist-400">
            {t("prescriptions.drugInteractions")}
          </h2>
          <InteractionAlert
            interactions={prescription.interactions}
            checkedAt={prescription.interactionsCheckedAt}
          />
        </div>
      )}

      {needsReviewCount > 0 && (
        <div className="glass-panel mt-6 flex items-center gap-3 border-amber-500/30 p-4">
          <HiOutlineExclamationTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-mist-200">
            {needsReviewCount === 1
              ? t("prescriptions.needsReviewOne")
              : t("prescriptions.needsReviewMany").replace("{count}", needsReviewCount)}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-400">
            {t("prescriptions.originalFile")}
          </h2>
          <div className="glass-panel mt-3 overflow-hidden p-2">
            {prescription.fileType === "pdf" ? (
              <a
                href={prescription.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded-xl bg-ink-900/60 p-10 text-sm font-medium text-signal-400 hover:underline"
              >
                {t("prescriptions.openPdf")}
              </a>
            ) : (
              <img
                src={prescription.fileUrl}
                alt="Uploaded prescription"
                className="w-full rounded-xl object-cover"
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowRawText((v) => !v)}
            className="mt-4 text-xs font-medium text-mist-400 hover:text-signal-400"
          >
            {showRawText ? t("prescriptions.hideRawText") : t("prescriptions.showRawText")}
          </button>
          {showRawText && (
            <pre className="glass-panel mt-2 max-h-64 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs text-mist-300">
              {prescription.ocrText || t("prescriptions.noTextExtracted")}
            </pre>
          )}
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-400">
            {t("prescriptions.medicinesDetected")}
          </h2>
          <div className="mt-3 space-y-3">
            {prescription.medicines.length === 0 && (
              <p className="text-sm text-mist-400">{t("prescriptions.noMedicinesDetected")}</p>
            )}
            {prescription.medicines.map((medicine) => (
              <MedicineCard
                key={medicine._id}
                prescriptionId={prescription._id}
                medicine={medicine}
                onUpdated={handleMedicineUpdated}
              />
            ))}
            <AddMedicineForm prescriptionId={prescription._id} onAdded={handleMedicineAdded} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrescriptionDetailPage;
