// Mirrors client/tailwind.config.js so the mobile app shares MedAssist's
// visual identity — clinical navy base, brand-blue gradient, teal AI accent,
// coral reserved strictly for drug-interaction warnings, graphite for auth.

export const colors = {
  ink: {
    950: "#050B18",
    900: "#0A1428",
    800: "#0F1E3A",
    700: "#16294D",
  },
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
  signal: {
    400: "#2DD4BF",
    500: "#14B8A6",
    600: "#0D9488",
  },
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
  graphite: {
    950: "#0D1417",
    900: "#111A1D",
    800: "#172428",
    700: "#1E2E33",
    600: "#28383D",
  },
  white: "#FFFFFF",
  success: "#22C55E",
  warning: "#F59E0B",
};

export const gradients = {
  brand: ["#1D4ED8", "#3B82F6", "#2DD4BF"],
  signal: ["#2DD4BF", "#0D9488"],
  auth: ["#172428", "#0D1417"],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700", color: colors.white },
  h2: { fontSize: 22, fontWeight: "700", color: colors.white },
  h3: { fontSize: 18, fontWeight: "600", color: colors.white },
  body: { fontSize: 15, fontWeight: "400", color: colors.mist[100] },
  bodyMuted: { fontSize: 14, fontWeight: "400", color: colors.mist[400] },
  label: { fontSize: 12, fontWeight: "600", color: colors.mist[400], letterSpacing: 0.4 },
  caption: { fontSize: 12, fontWeight: "400", color: colors.mist[400] },
};

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: {
    shadowColor: colors.signal[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
};

// Status -> color mapping used consistently across medicine/lab/interaction UI
export const statusColors = {
  within_range: colors.success,
  above_range: colors.alert[500],
  below_range: colors.alert[400],
  undetermined: colors.mist[400],
  mild: colors.warning,
  moderate: colors.alert[400],
  severe: colors.alert[500],
  processing: colors.brand[400],
  needs_review: colors.warning,
  processed: colors.success,
  failed: colors.alert[500],
  pending: colors.mist[400],
  due: colors.warning,
  taken: colors.success,
  missed: colors.alert[500],
};

export default { colors, gradients, spacing, radii, typography, shadows, statusColors };
