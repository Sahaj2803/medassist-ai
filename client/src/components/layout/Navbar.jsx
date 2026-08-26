import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { HiOutlineSparkles, HiOutlineUserCircle, HiOutlineShieldCheck } from "react-icons/hi2";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../hooks/useLanguage.js";
import LanguageSelector from "./LanguageSelector.jsx";

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
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate("/");
  };

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

        <div className="hidden items-center gap-2 lg:gap-3 md:flex">
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
                  <span className="hidden lg:inline">{t("nav.admin")}</span>
                </NavLink>
              )}
              <LanguageSelector />
              <NavLink
                to="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-mist-100 transition-colors hover:text-white"
              >
                <HiOutlineUserCircle className="h-5 w-5" />
                <span className="hidden lg:inline">{user?.name?.split(" ")[0]}</span>
              </NavLink>
              <NavLink to="/dashboard" className="btn-secondary !px-3 lg:!px-4 !py-2 text-sm">
                {t("nav.dashboard")}
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-primary !px-3 lg:!px-4 !py-2 text-sm"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-sm font-semibold text-mist-100 transition-colors hover:text-white"
              >
                {t("nav.login")}
              </NavLink>
              <NavLink to="/register" className="btn-primary !px-4 !py-2 text-sm">
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
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
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
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.prescriptions")}
                  </NavLink>
                  <NavLink
                    to="/lab-reports"
                    className="btn-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.labReports")}
                  </NavLink>
                  <NavLink
                    to="/diet-guide"
                    className="btn-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.dietGuide")}
                  </NavLink>
                  <NavLink
                    to="/medicines"
                    className="btn-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.medicines")}
                  </NavLink>
                  <NavLink
                    to="/reminders"
                    className="btn-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.reminders")}
                  </NavLink>
                  <NavLink
                    to="/chat"
                    className="btn-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.chat")}
                  </NavLink>
                  {user?.role === "admin" && (
                    <NavLink
                      to="/admin"
                      className="btn-secondary"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("nav.admin")}
                    </NavLink>
                  )}
                  <NavLink
                    to="/profile"
                    className="btn-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.profile")}
                  </NavLink>
                  <NavLink
                    to="/dashboard"
                    className="btn-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.dashboard")}
                  </NavLink>
                  <button type="button" onClick={handleLogout} className="btn-primary">
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="btn-secondary" onClick={() => setMobileOpen(false)}>
                    {t("nav.login")}
                  </NavLink>
                  <NavLink to="/register" className="btn-primary" onClick={() => setMobileOpen(false)}>
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
