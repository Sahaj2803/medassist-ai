// App-wide singleton wiring the pure store to AsyncStorage. Shared by
// LanguageProvider (React) and by non-React code (services, utils) that
// needs the active language, e.g. `import { t, getLanguage } from "../i18n/runtime"`.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLanguageStore } from "./languageStore";
import { createLanguageStorage } from "./languageStorage";
import { translate } from "./index";

export const languageStore = createLanguageStore({ storage: createLanguageStorage(AsyncStorage) });

export const getLanguage = () => languageStore.getSnapshot().language;
export const t = (key, params) => translate(getLanguage(), key, params);
