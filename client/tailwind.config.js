/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Clinical, trustworthy navy base — not a generic dark gray
        ink: {
          950: "#050B18",
          900: "#0A1428",
          800: "#0F1E3A",
          700: "#16294D",
        },
        // Primary blue gradient family (brief explicitly asks for blue gradient)
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#1E3A8A",
        },
        // Signal teal — used for OCR/scan/AI accents, keeps blue from being the only voice
        signal: {
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
        },
        // Muted coral, reserved strictly for drug-interaction warnings
        alert: {
          400: "#FB7185",
          500: "#F43F5E",
        },
        mist: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          300: "#CBD5E1",
          400: "#94A3B8",
        },
        // Dark graphite neutrals — used only by the auth (login/register) UI
        graphite: {
          950: "#0D1417",
          900: "#111A1D",
          800: "#172428",
          700: "#1E2E33",
          600: "#28383D",
        },
      },
      fontFamily: {
        display: [
          "Söhne",
          "Sora",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        body: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 45%, #2DD4BF 100%)",
        "hero-glow":
          "radial-gradient(60% 60% at 50% 0%, rgba(59,130,246,0.25) 0%, rgba(5,11,24,0) 70%)",
        "signal-gradient": "linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(5, 11, 24, 0.37)",
        "glow-brand": "0 0 40px -10px rgba(59, 130, 246, 0.5)",
        // Soft neumorphic depth + teal focus glow — auth UI only
        neumorph:
          "0 40px 90px -20px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04) inset, 0 0 60px -18px rgba(45, 212, 191, 0.18)",
        "input-inset": "inset 0 2px 6px rgba(0, 0, 0, 0.35), inset 0 -1px 0 0 rgba(255, 255, 255, 0.02)",
        "glow-teal": "0 0 0 3px rgba(45, 212, 191, 0.16), 0 0 36px -6px rgba(45, 212, 191, 0.55)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        scanline: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
        dropdownIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        scanline: "scanline 2.4s ease-in-out infinite",
        "dropdown-in": "dropdownIn 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
