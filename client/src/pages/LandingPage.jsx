import { motion } from "framer-motion";
import {
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBeaker,
  HiOutlineLockClosed,
} from "react-icons/hi2";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const features = [
  {
    icon: HiOutlineDocumentText,
    title: "Handwriting to data, in seconds",
    body: "Snap a photo of any prescription. OCR trained on clinical handwriting turns it into structured medicine, dosage, and timing data.",
  },
  {
    icon: HiOutlineBeaker,
    title: "Plain-language medicine breakdowns",
    body: "Gemini explains what each medicine does, why it's prescribed, and what to watch for — without the pharmacology degree.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Drug interaction detection",
    body: "Every new prescription is cross-checked against your history so conflicting medicines get flagged before they become a problem.",
  },
  {
    icon: HiOutlineBell,
    title: "Reminders that build themselves",
    body: "Dosage and timing detected from the scan become a reminder as soon as you confirm it — delivered over email and browser push.",
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: "Ask anything, anytime",
    body: "A medicine-aware chatbot answers follow-up questions about your own prescriptions and history.",
  },
  {
    icon: HiOutlineLockClosed,
    title: "Built on a secure foundation",
    body: "JWT auth, hashed credentials, rate limiting, and sanitized input protect every record end to end.",
  },
];

const workflow = [
  { step: "01", title: "Upload", body: "Photograph or upload a prescription — paper or PDF." },
  { step: "02", title: "Extract", body: "OCR reads the handwriting; low-confidence fields are flagged for a quick confirm." },
  { step: "03", title: "Analyze", body: "Gemini identifies each medicine, dosage, and schedule, and checks for interactions." },
  { step: "04", title: "Remind", body: "A reminder plan is created automatically and delivered where you'll actually see it." },
];

function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute -left-40 top-40 h-96 w-96 rounded-full bg-brand-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-96 h-96 w-96 rounded-full bg-signal-500/10 blur-[120px]" />

      {/* ---------------- HERO ---------------- */}
      <section className="container-shell relative flex flex-col items-center pb-24 pt-20 text-center lg:pt-28">
        <motion.span
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="section-eyebrow rounded-full border border-white/10 bg-white/5 px-4 py-1.5"
        >
          AI-powered prescription intelligence
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-6 max-w-3xl text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl"
        >
          Every prescription,
          <span className="bg-brand-gradient bg-clip-text text-transparent"> understood</span>
          {" "}in seconds.
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay: 0.1 } } }}
          className="mt-6 max-w-xl text-lg text-mist-300"
        >
          MedAssist scans handwritten prescriptions, explains every medicine in
          plain language, catches dangerous interactions, and reminds you
          exactly when to take what.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay: 0.2 } } }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <a href="/register" className="btn-primary">
            Get started free
          </a>
          <a href="#how-it-works" className="btn-secondary">
            See how it works
          </a>
        </motion.div>

        {/* Signature element: animated prescription scan panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="relative mt-20 w-full max-w-3xl"
        >
          <div className="glass-panel-strong animate-float overflow-hidden p-6 sm:p-10">
            <div className="grid gap-8 sm:grid-cols-2">
              {/* Left: mock scanned prescription with scan line */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-ink-900/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-mist-400">
                  Scanning prescription
                </p>
                <div className="mt-4 space-y-2 font-mono text-sm text-mist-300">
                  <p className="opacity-70">Dr. R. Sharma — 24 Jul 2026</p>
                  <p>Amoxicillin 500mg</p>
                  <p>Sig: 1 tab TID x 7d</p>
                  <p className="opacity-70">Paracetamol 650mg</p>
                  <p className="opacity-40">Ibuprofen 400mg</p>
                </div>
                <div className="absolute inset-x-0 top-0 h-16 animate-scanline bg-gradient-to-b from-signal-400/40 to-transparent" />
              </div>

              {/* Right: extracted structured result */}
              <div className="flex flex-col justify-center gap-3">
                {[
                  { name: "Amoxicillin", dose: "500mg · 3x daily · 7 days" },
                  { name: "Paracetamol", dose: "650mg · as needed" },
                ].map((med) => (
                  <div
                    key={med.name}
                    className="rounded-xl border border-signal-500/30 bg-signal-500/10 px-4 py-3 text-left"
                  >
                    <p className="text-sm font-semibold text-white">{med.name}</p>
                    <p className="text-xs text-mist-300">{med.dose}</p>
                  </div>
                ))}
                <div className="mt-1 flex items-center gap-2 text-xs font-medium text-signal-400">
                  <HiOutlineShieldCheck className="h-4 w-4" />
                  No interactions detected
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section id="product" className="container-shell py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="section-eyebrow">Product</span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            One scan replaces a dozen searches
          </h2>
          <p className="mt-4 text-mist-300">
            Everything you need to go from a handwritten prescription to a
            clear plan you can actually follow.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={stagger}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp} className="glass-panel p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gradient">
                <f.icon className="h-5 w-5 text-white" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist-300">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how-it-works" className="container-shell py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="section-eyebrow">How it works</span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            From paper to plan, automatically
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={stagger}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {workflow.map((w) => (
            <motion.div key={w.step} variants={fadeUp} className="glass-panel p-6">
              <span className="font-mono text-sm text-signal-400">{w.step}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist-300">{w.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---------------- SECURITY ---------------- */}
      <section id="security" className="container-shell py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="glass-panel-strong flex flex-col items-center gap-6 p-10 text-center sm:p-16"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient">
            <HiOutlineLockClosed className="h-6 w-6 text-white" />
          </span>
          <h2 className="max-w-xl text-3xl font-bold text-white sm:text-4xl">
            Your prescriptions stay private, always
          </h2>
          <p className="max-w-xl text-mist-300">
            Passwords are hashed, sessions are signed with JWT, requests are
            rate-limited, and every input is sanitized before it touches the
            database.
          </p>
          <a href="/register" id="pricing" className="btn-primary mt-2">
            Create your free account
          </a>
        </motion.div>
      </section>
    </div>
  );
}

export default LandingPage;
