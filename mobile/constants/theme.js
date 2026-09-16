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
  upcoming: colors.warning,
  taken: colors.success,
  missed: colors.alert[500],
};

export default { colors, gradients, spacing, radii, typography, shadows, statusColors };

// ============================================================================
// PART 2 — Light/Dark theme system
// ============================================================================
// Additive only: nothing above this line is modified, so every screen that
// still imports { colors, typography, ... } directly (Home, Reminders, Lab
// Reports, Chat, Health Timeline, Profile, Settings — all out of scope for
// Part 2) keeps rendering exactly as before.
//
// This is the "minimum compatible theme infrastructure" called for when
// Part 1's real buildTheme/lightTheme/darkTheme aren't present yet in this
// ZIP. Naming (buildTheme, lightTheme, darkTheme, ThemeProvider, useTheme)
// matches the Part 1 spec so this can be reconciled with Part 1 later
// without an API change — ideally Part 1 simply supersedes this block.

const sharedSpacing = spacing;
const sharedRadii = radii;

const fontSizes = {
  h1: { fontSize: 28, fontWeight: "700" },
  h2: { fontSize: 22, fontWeight: "700" },
  h3: { fontSize: 18, fontWeight: "600" },
  h4: { fontSize: 16, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400" },
  bodyMuted: { fontSize: 14, fontWeight: "400" },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.4 },
  caption: { fontSize: 12, fontWeight: "400" },
  button: { fontSize: 15, fontWeight: "700" },
};

export const lightTheme = {
  mode: "light",
  colors: {
    background: "#F7FAFF",
    surface: "#FFFFFF",
    elevatedSurface: "#FFFFFF",
    primary: "#2F6BFF",
    primaryDark: "#1F56E8",
    teal: "#20C7A5",
    purple: "#7B61FF",
    orange: "#FFAA3B",
    error: "#F56C6C",
    success: "#20C7A5",
    textPrimary: "#10254A",
    textSecondary: "#6B7A90",
    border: "#E5ECF5",
    white: "#FFFFFF",
    overlay: "rgba(16,37,74,0.45)",
    inputBackground: "#F7FAFF",
  },
  gradients: {
    primary: ["#2F6BFF", "#1F56E8"],
    hero: ["#2F6BFF", "#7B61FF"],
    teal: ["#20C7A5", "#1FA98C"],
  },
  spacing: sharedSpacing,
  radii: sharedRadii,
  typography: fontSizes,
  shadow: {
    shadowColor: "#10254A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
};

export const darkTheme = {
  mode: "dark",
  colors: {
    background: "#07111F",
    surface: "#0D1B2D",
    elevatedSurface: "#10243A",
    primary: "#2F7BFF",
    primaryDark: "#2F6BFF",
    teal: "#20C7A5",
    purple: "#8B6CFF",
    orange: "#FFB347",
    error: "#FF7373",
    success: "#20C7A5",
    textPrimary: "#F5F8FF",
    textSecondary: "#91A3BA",
    border: "rgba(255,255,255,0.08)",
    white: "#FFFFFF",
    overlay: "rgba(3,9,18,0.6)",
    inputBackground: "#0D1B2D",
  },
  gradients: {
    primary: ["#2F7BFF", "#1F56E8"],
    hero: ["#2F7BFF", "#8B6CFF"],
    teal: ["#20C7A5", "#158F76"],
  },
  spacing: sharedSpacing,
  radii: sharedRadii,
  typography: fontSizes,
  shadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
};

// Same status -> color mapping as `statusColors` above, but resolved against
// a theme's own palette instead of the fixed dark ink/mist/alert scale, so
// badges look correct on a light background too. Kept in sync by design:
// same status keys as `statusColors`.
export function statusColorFor(theme, status) {
  const c = theme.colors;
  const map = {
    within_range: c.success,
    above_range: c.error,
    below_range: c.orange,
    undetermined: c.textSecondary,
    mild: c.orange,
    moderate: c.error,
    severe: c.error,
    processing: c.primary,
    needs_review: c.orange,
    processed: c.success,
    failed: c.error,
    pending: c.textSecondary,
    due: c.orange,
    upcoming: c.orange,
    taken: c.success,
    missed: c.error,
  };
  return map[status] || c.textSecondary;
}

export function buildTheme(scheme) {
  return scheme === "light" ? lightTheme : darkTheme;
}
