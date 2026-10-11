
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import {
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineShieldCheck,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import LanguageSelector from "./LanguageSelector.jsx";

const APK_RELEASE_URL =
  "https://github.com/Sahaj2803/medassist-ai/releases/tag/v1.0.0";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const downloadLabels = {
    en: "Download App",
    hi: "ऐप डाउनलोड करें",
    gu: "એપ ડાઉનલોડ કરો",
  };

  const downloadLabel =
    downloadLabels[language] || downloadLabels.en;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMobileOpen(false);

  const downloadButton = (
    <a
      href={APK_RELEASE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-400/40 px-3 py-2 text-sm font-semibold text-teal-200 transition-colors hover:bg-white/10"
      onClick={closeMenu}
    >
      <HiOutlineArrowDownTray className="h-4 w-4" />
      {downloadLabel}
    </a>
  );

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-ink-950/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="container-shell flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
            <HiOutlineSparkles className="h-4 w-4 text-white" />
          </span>
          <span className="font-display text-lg font-bold text-white">
            MedAssist
          </span>
        </Link>

        {!isAuthenticated && (
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-mist-300 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div className="hidden items-center gap-2 md:flex lg:gap-3">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/prescriptions"
                className="text-sm font-medium text-mist-300 transition-colors hover:text-white"
              >
                {t("nav.prescriptions")}
              </NavLink>
              <NavLink
                to="/lab-reports"
                className="text-sm font-medium text-mist-300 transition-colors hover:text-white"
              >
                {t("nav.labReports")}
              </NavLink>
              <NavLink
                to="/diet-guide"
                className="text-sm font-medium text-mist-300 transition-colors hover:text-white"
              >
                {t("nav.dietGuide")}
              </NavLink>
              <NavLink
                to="/medicines"
                className="text-sm font-medium text-mist-300 transition-colors hover:text-white"
              >
                {t("nav.medicines")}
              </NavLink>
              <NavLink
                to="/reminders"
                className="text-sm font-medium text-mist-300 transition-colors hover:text-white"
              >
                {t("nav.reminders")}
              </NavLink>
              <NavLink
                to="/chat"
                className="text-sm font-medium text-mist-300 transition-colors hover:text-white"
              >
                {t("nav.chat")}
              </NavLink>

              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className="flex items-center gap-1 text-sm font-medium text-signal-400 transition-colors hover:text-signal-500"
                >
                  <HiOutlineShieldCheck className="h-4 w-4" />
                  <span className="hidden lg:inline">
                    {t("nav.admin")}
                  </span>
                </NavLink>
              )}

              <LanguageSelector />

              <NavLink
                to="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-mist-100 transition-colors hover:text-white"
              >
                <HiOutlineUserCircle className="h-5 w-5" />
                <span className="hidden lg:inline">
                  {user?.name?.split(" ")[0]}
                </span>
              </NavLink>

              <NavLink
                to="/dashboard"
                className="btn-secondary !px-3 !py-2 text-sm lg:!px-4"
              >
                {t("nav.dashboard")}
              </NavLink>

              {downloadButton}

              <button
                type="button"
                onClick={handleLogout}
                className="btn-primary !px-3 !py-2 text-sm lg:!px-4"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              {downloadButton}

              <NavLink
                to="/login"
                className="text-sm font-semibold text-mist-100 transition-colors hover:text-white"
              >
                {t("nav.login")}
              </NavLink>

              <NavLink
                to="/register"
                className="btn-primary !px-4 !py-2 text-sm"
              >
                {t("nav.getStarted")}
              </NavLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-mist-100 md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <HiOutlineX className="h-6 w-6" />
          ) : (
            <HiOutlineMenu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-ink-950/95 px-6 pb-6 pt-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4">
            {!isAuthenticated &&
              navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMenu}
                  className="text-sm font-medium text-mist-300 hover:text-white"
                >
                  {link.label}
                </a>
              ))}

            <div className="mt-2 flex flex-col gap-3 border-t border-white/10 pt-4">
              {isAuthenticated && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-mist-400">
                    {t("language.label")}
                  </span>
                  <LanguageSelector />
                </div>
              )}

              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/prescriptions"
                    className="btn-secondary"
                    onClick={closeMenu}
                  >
                    {t("nav.prescriptions")}
                  </NavLink>

                  <NavLink
                    to="/lab-reports"
                    className="btn-secondary"
                    onClick={closeMenu}
                  >
                    {t("nav.labReports")}
                  </NavLink>

                  <NavLink
                    to="/diet-guide"
                    className="btn-secondary"
                    onClick={closeMenu}
                  >
                    {t("nav.dietGuide")}
                  </NavLink>

                  <NavLink
                    to="/medicines"
                    className="btn-secondary"
                    onClick={closeMenu}
                  >
                    {t("nav.medicines")}
                  </NavLink>

                  <NavLink
                    to="/reminders"
                    className="btn-secondary"
                    onClick={closeMenu}
                  >
                    {t("nav.reminders")}
                  </NavLink>

                  <NavLink
                    to="/chat"
                    className="btn-secondary"
                    onClick={closeMenu}
                  >
                    {t("nav.chat")}
                  </NavLink>

                  {user?.role === "admin" && (
                    <NavLink
                      to="/admin"
                      className="btn-secondary"
                      onClick={closeMenu}
                    >
                      {t("nav.admin")}
                    </NavLink>
                  )}

                  <NavLink
                    to="/profile"
                    className="btn-secondary"
                    onClick={closeMenu}
                  >
                    {t("nav.profile")}
                  </NavLink>

                  <NavLink
                    to="/dashboard"
                    className="btn-secondary"
                    onClick={closeMenu}
                  >
                    {t("nav.dashboard")}
                  </NavLink>

                  {downloadButton}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn-primary"
                  >
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  {downloadButton}

                  <NavLink
                    to="/login"
                    className="btn-secondary"
                    onClick={closeMenu}
                  >
                    {t("nav.login")}
                  </NavLink>

                  <NavLink
                    to="/register"
                    className="btn-primary"
                    onClick={closeMenu}
                  >
                    {t("nav.getStarted")}
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
