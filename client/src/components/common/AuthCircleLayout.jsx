import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineSparkles } from "react-icons/hi2";

/**
 * Shared neumorphic, circular authentication shell — Style B
 * (Dark Graphite + Teal). Used only by LoginPage and RegisterPage so
 * the rest of the app (ForgotPassword/ResetPassword, dashboard, etc.)
 * is left untouched.
 */
function AuthBackgroundDecor() {
  const pluses = [
    { pos: "left-[8%] top-[14%]", size: "h-4 w-4", delay: 0 },
    { pos: "left-[14%] top-[68%]", size: "h-3 w-3", delay: 0.6 },
    { pos: "left-[6%] top-[42%]", size: "h-2.5 w-2.5", delay: 1.2 },
    { pos: "right-[10%] top-[20%]", size: "h-3 w-3", delay: 0.3 },
    { pos: "right-[16%] top-[72%]", size: "h-4 w-4", delay: 0.9 },
    { pos: "right-[6%] top-[48%]", size: "h-2.5 w-2.5", delay: 1.5 },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* faint flowing wave lines */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.05]"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
      >
        <path
          d="M-100 620 C 250 520, 500 720, 800 600 S 1250 520, 1400 600"
          fill="none"
          stroke="#2DD4BF"
          strokeWidth="1.5"
        />
        <path
          d="M-100 180 C 250 80, 500 260, 800 160 S 1250 80, 1400 160"
          fill="none"
          stroke="#2DD4BF"
          strokeWidth="1.5"
        />
      </svg>

      {/* scattered medical plus marks — gently floating */}
      {pluses.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute ${p.pos} ${p.size} opacity-[0.14]`}
          animate={{ y: [0, -8, 0], opacity: [0.08, 0.2, 0.08] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        >
          <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-signal-400" />
          <span className="absolute top-1/2 left-0 h-[1.5px] w-full -translate-y-1/2 bg-signal-400" />
        </motion.span>
      ))}
    </div>
  );
}

function AuthCircleLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-b from-graphite-950 via-graphite-900 to-graphite-950 px-4 py-6 sm:px-6 sm:py-8">
      {/* ambient glow — teal + a touch of brand blue for a richer duotone */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-[8%] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-signal-500/[0.14] blur-[120px]"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand-500/[0.07] blur-[100px]" />
        <div className="absolute -right-16 top-1/3 h-64 w-64 rounded-full bg-signal-400/[0.08] blur-[100px]" />
      </div>

      <AuthBackgroundDecor />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/*
          Outer sizing shell: bounded by both vh and vw so it always
          fits the viewport without scrolling. It carries no visible
          background of its own — the ring, halo and card below all
          inherit its border-radius so everything stays perfectly
          concentric at any screen size.
        */}
        <div
          style={{ width: "clamp(20rem, min(74vh, 82vw), 38rem)" }}
          className="relative rounded-[2.25rem] sm:aspect-square sm:rounded-full"
        >
          {/* rotating teal scan ring */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-3 rounded-[inherit] opacity-80"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(45,212,191,0.55) 6%, transparent 16%, transparent 84%, rgba(45,212,191,0.4) 94%, transparent 100%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          />

          {/* pulsing teal halo */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 rounded-[inherit] bg-signal-400/[0.08] blur-2xl"
            animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.03, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* the card itself */}
          <div className="relative flex h-full w-full flex-col items-center justify-center rounded-[inherit] border border-white/[0.08] bg-gradient-to-br from-graphite-700 to-graphite-900 px-7 py-10 shadow-neumorph sm:px-12 sm:py-12">
            {/* soft top-left light source for neumorphic depth */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.05] via-transparent to-black/20"
            />
            {/* crisp teal edge ring — gives the panel presence against the background */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-signal-400/[0.16]"
            />

            <div className="relative mx-auto flex w-full max-w-[16.5rem] flex-col items-center text-center sm:max-w-[19rem]">
              <Link to="/" className="flex flex-col items-center gap-1.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-signal-gradient shadow-glow-teal">
                  <HiOutlineSparkles className="h-5 w-5 text-graphite-950" />
                </span>
                <span className="font-display text-base font-bold tracking-tight text-signal-400">
                  MedAssist
                </span>
              </Link>

              <h1 className="mt-4 text-xl font-bold text-white sm:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-xs text-mist-300 sm:text-sm">
                  {subtitle}
                </p>
              )}

              <div className="mt-6 w-full">{children}</div>
            </div>
          </div>
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-mist-300">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default AuthCircleLayout;
