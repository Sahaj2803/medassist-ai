import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineCloudArrowUp, HiOutlineDocumentText, HiOutlinePhoto } from "react-icons/hi2";
import labReportService from "../../services/labReportService.js";
import { useLanguage } from "../../hooks/useLanguage.js";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function LabReportUploadPage() {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const validateAndSetFile = useCallback(
    (candidate) => {
      if (!candidate) return;
      if (!ACCEPTED_TYPES.includes(candidate.type)) {
        toast.error(t("prescriptions.invalidType"));
        return;
      }
      if (candidate.size > MAX_SIZE_BYTES) {
        toast.error(t("prescriptions.fileTooLarge"));
        return;
      }
      setFile(candidate);
    },
    [t]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const { labReport } = await labReportService.upload(file, (evt) => {
        if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      toast.success(t("labReports.uploadedToastSuccess"));
      navigate(`/lab-reports/${labReport._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || t("errors.uploadFailed"));
      setUploading(false);
    }
  };

  return (
    <div className="container-shell max-w-2xl py-16">
      <span className="section-eyebrow">{t("labReports.pageEyebrow")}</span>
      <h1 className="mt-3 text-3xl font-bold text-white">{t("labReports.uploadTitle")}</h1>
      <p className="mt-2 text-mist-300">{t("labReports.uploadDescription")}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          dragOver ? "border-signal-400 bg-signal-500/5" : "border-white/15 bg-white/[0.02]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => validateAndSetFile(e.target.files?.[0])}
        />
        <HiOutlineCloudArrowUp className="h-10 w-10 text-signal-400" />
        <p className="mt-4 font-medium text-white">{t("prescriptions.dragDrop")}</p>
        <p className="mt-1 text-xs text-mist-400">{t("prescriptions.acceptedTypes")}</p>
      </div>

      {file && (
        <div className="glass-panel mt-6 flex items-center gap-3 p-4">
          {file.type === "application/pdf" ? (
            <HiOutlineDocumentText className="h-6 w-6 shrink-0 text-signal-400" />
          ) : (
            <HiOutlinePhoto className="h-6 w-6 shrink-0 text-signal-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{file.name}</p>
            <p className="text-xs text-mist-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-brand-gradient transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary mt-8 w-full"
      >
        {uploading ? t("prescriptions.uploading").replace("{progress}", progress) : t("labReports.uploadAndAnalyze")}
      </button>

      <p className="mt-4 text-center text-xs text-mist-400">{t("labReports.disclaimerShort")}</p>
    </div>
  );
}

export default LabReportUploadPage;
