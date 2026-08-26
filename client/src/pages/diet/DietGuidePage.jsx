import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineClock,
  HiOutlineTrash,
} from "react-icons/hi2";
import dietService from "../../services/dietService.js";
import DietGuideForm from "../../components/diet/DietGuideForm.jsx";
import DietGuideResult from "../../components/diet/DietGuideResult.jsx";
import DietGuideLoading from "../../components/diet/DietGuideLoading.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

/**
 * Two modes, driven by the optional :id route param:
 *  - /diet-guide       -> fresh generation flow (health form -> result)
 *  - /diet-guide/:id   -> view a previously generated guide, with the
 *                          option to regenerate it using the latest
 *                          available information
 */
function DietGuidePage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();

  const [dietGuide, setDietGuide] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!id) {
      setDietGuide(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    dietService
      .getById(id)
      .then((data) => setDietGuide(data.dietGuide))
      .catch((err) => {
        toast.error(err.response?.data?.message || t("diet.notFoundToast"));
        navigate("/diet-guide/history");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleGenerated = (guide) => {
    setDietGuide(guide);
    toast.success(t("diet.readyToast"));
    navigate(`/diet-guide/${guide._id}`, { replace: true });
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const { dietGuide: updated } = await dietService.regenerate(id);
      setDietGuide(updated);
      toast.success(t("diet.regeneratedToast"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("diet.couldNotRegenerate"));
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("diet.deleteConfirm"))) return;
    try {
      await dietService.remove(id);
      toast.success(t("diet.deletedToastSuccess"));
      navigate("/diet-guide/history");
    } catch (err) {
      toast.error(err.response?.data?.message || t("diet.couldNotDelete"));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="container-shell max-w-3xl py-16">
      {id ? (
        <button
          type="button"
          onClick={() => navigate("/diet-guide/history")}
          className="flex items-center gap-1.5 text-sm text-mist-400 hover:text-white"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          {t("diet.backToMyGuides")}
        </button>
      ) : (
        <div>
          <span className="section-eyebrow">{t("diet.pageEyebrow")}</span>
          <h1 className="mt-3 text-3xl font-bold text-white">{t("diet.getGuidance")}</h1>
          <p className="mt-2 max-w-xl text-mist-300">{t("diet.pageDescription")}</p>
          <Link
            to="/diet-guide/history"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-signal-400 hover:text-signal-500"
          >
            <HiOutlineClock className="h-4 w-4" />
            {t("diet.viewPast")}
          </Link>
        </div>
      )}

      <div className="mt-8">
        {!dietGuide && !id && <DietGuideForm onGenerated={handleGenerated} />}

        {regenerating && <DietGuideLoading />}

        {dietGuide && !regenerating && (
          <div className="space-y-4">
            <DietGuideResult dietGuide={dietGuide} />
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleRegenerate} className="btn-secondary !px-4 !py-2 text-sm">
                <HiOutlineArrowPath className="h-4 w-4" />
                {t("diet.regenerateGuide")}
              </button>
              {id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 rounded-lg border border-alert-500/30 px-3 py-2 text-sm text-alert-400 hover:bg-alert-500/10"
                >
                  <HiOutlineTrash className="h-4 w-4" />
                  {t("common.delete")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DietGuidePage;
