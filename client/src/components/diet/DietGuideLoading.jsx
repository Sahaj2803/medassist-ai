import { useEffect, useState } from "react";
import { useLanguage } from "../../hooks/useLanguage.js";

/**
 * Cycles through friendly status messages while generation is in
 * flight, so the UI never appears frozen during the AI call.
 */
function DietGuideLoading() {
  const { t } = useLanguage();
  const messages = [t("diet.loadingMessage1"), t("diet.loadingMessage2"), t("diet.loadingMessage3")];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 1800);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  return (
    <div className="glass-panel flex flex-col items-center gap-4 p-12 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-signal-400" />
      <p className="text-sm text-mist-300">{messages[index]}</p>
    </div>
  );
}

export default DietGuideLoading;
