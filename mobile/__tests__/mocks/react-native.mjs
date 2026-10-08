export const Platform = {
  get OS() { return globalThis.__platform || "android"; },
};
export const AppState = { addEventListener: () => ({ remove() {} }) };
export const Linking = { openSettings() {} };
