import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineClipboardDocumentList, HiOutlinePlus } from "react-icons/hi2";
import dietService from "../../services/dietService.js";
import DietGuideCard from "../../components/diet/DietGuideCard.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function DietGuideHistoryPage() {
  const { t } = useLanguage();
  const [dietGuides, setDietGuides] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    dietService
      .history()
      .then((data) => {
        if (!cancelled) setDietGuides(data.dietGuides);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || t("diet.couldNotLoadHistory"));
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
          <span className="section-eyebrow">{t("diet.pageEyebrow")}</span>
          <h1 className="mt-3 text-3xl font-bold text-white">{t("diet.historyTitle")}</h1>
        </div>
        <Link to="/diet-guide" className="btn-primary">
          <HiOutlinePlus className="h-4 w-4" />
          {t("diet.newDietGuide")}
        </Link>
      </div>

      {dietGuides.length === 0 ? (
        <div className="glass-panel mt-10 flex flex-col items-center gap-3 p-16 text-center">
          <HiOutlineClipboardDocumentList className="h-10 w-10 text-mist-400" />
          <h2 className="text-lg font-semibold text-white">{t("diet.noGuidesTitle")}</h2>
          <p className="max-w-sm text-sm text-mist-300">{t("diet.noGuidesBody")}</p>
          <Link to="/diet-guide" className="btn-primary mt-2">
            {t("diet.generateAGuide")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dietGuides.map((g) => (
            <DietGuideCard key={g._id} dietGuide={g} />
          ))}
        </div>
      )}
    </div>
  );
}

export default DietGuideHistoryPage;
