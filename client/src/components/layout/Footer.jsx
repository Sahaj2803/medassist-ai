import { HiOutlineSparkles } from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

function Footer() {
  const { t } = useLanguage();

  const columns = [
    {
      title: t("footer.productHeading"),
      links: [t("footer.productLink1"), t("footer.productLink2"), t("footer.productLink3"), t("footer.productLink4")],
    },
    {
      title: t("footer.companyHeading"),
      links: [t("footer.companyLink1"), t("footer.companyLink2"), t("footer.companyLink3")],
    },
    {
      title: t("footer.legalHeading"),
      links: [t("footer.legalLink1"), t("footer.legalLink2"), t("footer.legalLink3")],
    },
  ];

  return (
    <footer className="border-t border-white/10 bg-ink-950">
      <div className="container-shell py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
                <HiOutlineSparkles className="h-4 w-4 text-white" />
              </span>
              <span className="font-display text-lg font-bold text-white">
                MedAssist
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-400">{t("footer.tagline")}</p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-mist-400 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-mist-400">
            {t("footer.copyright").replace("{year}", new Date().getFullYear())}
          </p>
          <p className="text-xs text-mist-400">{t("footer.disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
