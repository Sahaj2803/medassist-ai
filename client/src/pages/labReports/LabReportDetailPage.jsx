import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles,
} from "react-icons/hi2";
import labReportService from "../../services/labReportService.js";
import StatusBadge from "../../components/prescriptions/StatusBadge.jsx";
import GroupCard from "../../components/labReports/GroupCard.jsx";
import TestResultCard from "../../components/labReports/TestResultCard.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function LabReportDetailPage() {
  const { t, language } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = () => {
    labReportService
      .getById(id)
      .then((data) => setReport(data.labReport))
      .catch((err) => {
        toast.error(err.response?.data?.message || t("labReports.notFoundToast"));
        navigate("/lab-reports");
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [id, navigate]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { labReport } = await labReportService.analyze(id);
      setReport(labReport);
      toast.success(t("labReports.analysisComplete"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("labReports.analysisFailed"));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("labReports.deleteConfirm"))) return;
    try {
      await labReportService.remove(id);
      toast.success(t("labReports.deletedToastSuccess"));
      navigate("/lab-reports");
    } catch (err) {
      toast.error(err.response?.data?.message || t("labReports.couldNotDelete"));
    }
  };

  if (loading) return <PageLoader />;
  if (!report) return null;

  const abnormalCount = report.results.filter((r) => r.status !== "within_range").length;

  const resultsByName = Object.fromEntries(report.results.map((r) => [r.testName, r]));
  const groupedTestNames = new Set(
    (report.groups || []).flatMap((g) => g.testNames)
  );
  const ungroupedResults = report.results.filter((r) => !groupedTestNames.has(r.testName));

  return (
    <div className="container-shell max-w-4xl py-16">
      <button
        type="button"
        onClick={() => navigate("/lab-reports")}
        className="flex items-center gap-1.5 text-sm text-mist-400 hover:text-white"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        {t("labReports.backToReports")}
      </button>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {report.labName || report.originalName}
            </h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="mt-1 text-sm text-mist-400">
            {report.reportDate
              ? `${t("labReports.reportDate").replace(
                  "{date}",
                  new Date(report.reportDate).toLocaleDateString(language)
                )} · `
              : ""}
            {t("labReports.uploadedOn").replace(
              "{date}",
              new Date(report.createdAt).toLocaleString(language)
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || report.results.length === 0}
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            <HiOutlineSparkles className="h-4 w-4 text-signal-400" />
            {analyzing
              ? t("common.analyzing")
              : report.analyzedAt
              ? t("common.reanalyze")
              : t("common.analyzeWithAi")}
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

      {report.uncertainNote && (
        <div className="glass-panel mt-6 flex items-start gap-3 border-amber-500/30 p-4">
          <HiOutlineExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-mist-200">{report.uncertainNote}</p>
        </div>
      )}

      {report.overallSummary && (
        <div className="glass-panel-strong mt-6 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-400">
            {t("labReports.overallSummary")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-mist-100">{report.overallSummary}</p>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-400">
            {t("labReports.testResults")}
          </h2>
          {abnormalCount > 0 && (
            <span className="text-xs font-medium text-amber-400">
              {abnormalCount === 1
                ? t("labReports.valuesNeedAttentionOne")
                : t("labReports.valuesNeedAttentionMany").replace("{count}", abnormalCount)}
            </span>
          )}
        </div>

        {report.results.length === 0 ? (
          <p className="mt-3 text-sm text-mist-400">{t("labReports.noResultsExtracted")}</p>
        ) : (
          <div className="mt-3 space-y-4">
            {(report.groups || []).map((group) => (
              <GroupCard key={group.name} group={group} resultsByName={resultsByName} />
            ))}

            {ungroupedResults.length > 0 && (
              <>
                {report.groups?.length > 0 && (
                  <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-mist-400">
                    {t("labReports.otherResults")}
                  </p>
                )}
                <div className="space-y-3">
                  {ungroupedResults.map((r) => (
                    <TestResultCard key={r.testName} result={r} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-mist-400">{t("labReports.diagnosisDisclaimer")}</p>
    </div>
  );
}

export default LabReportDetailPage;
