import { Link } from "react-router-dom";
import { HiOutlineSparkles } from "react-icons/hi2";

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-brand-600/20 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient">
              <HiOutlineSparkles className="h-4 w-4 text-white" />
            </span>
            <span className="font-display text-lg font-bold text-white">
              MedAssist
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-mist-300">{subtitle}</p>}
        </div>

        <div className="glass-panel-strong p-6 sm:p-8">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-mist-300">{footer}</div>}
      </div>
    </div>
  );
}

export default AuthLayout;
