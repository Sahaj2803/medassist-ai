// import Prescription from "../models/Prescription.js";
// import Medicine from "../models/Medicine.js";
// import { translateStructuredContent } from "../ai/groq.service.js";

// const LANGS = new Set(["en", "hi", "gu"]);
// const pick = (doc, paths) => Object.fromEntries(paths.map((p) => [p, p.split(".").reduce((v, k) => v?.[k], doc)]).filter(([,v]) => v !== undefined));
// const setPath = (obj, path, value) => { const parts = path.split("."); let cur = obj; for (const part of parts.slice(0,-1)) cur = cur[part] ??= {}; cur[parts.at(-1)] = value; };

// // Only human-readable AI explanations for prescriptions and medicines are auto-synced.
// // Lab reports and diet guides intentionally remain in their creation language and change only
// // when the user explicitly regenerates them.
// // Medicine names, dosage, frequencies, OCR/source text, test names, values, units and reference ranges stay untouched.
// const CONFIGS = [
//   { Model: Prescription, paths: ["interactions"], fields: (d) => ({ interactions: (d.interactions || []).map((x) => ({ medicineA:x.medicineA, medicineB:x.medicineB, severity:x.severity, description:x.description })) }), apply: (d,v) => { if (Array.isArray(v.interactions)) d.interactions = v.interactions.map((x,i) => ({ medicineA:d.interactions[i]?.medicineA ?? x.medicineA, medicineB:d.interactions[i]?.medicineB ?? x.medicineB, severity:d.interactions[i]?.severity ?? x.severity, description:x.description ?? d.interactions[i]?.description })); } },
//   { Model: Medicine, has: (d) => d.aiAnalysis, fields: (d) => ({ aiAnalysis: d.aiAnalysis }), apply: (d,v) => { d.aiAnalysis = v.aiAnalysis; } },
// ];

// export async function syncUserLanguage(userId, language) {
//   if (!LANGS.has(language)) throw new Error("Unsupported language");
//   const result = { language, translated: 0, skipped: 0, errors: 0 };
//   for (const cfg of CONFIGS) {
//     const docs = await cfg.Model.find({ user:userId }).select("+languageContent").sort({ createdAt:-1 }).limit(100);
//     for (const doc of docs) {
//       if (cfg.has && !cfg.has(doc)) { result.skipped++; continue; }
//       try {
//         const state = doc.languageContent && typeof doc.languageContent === "object" ? doc.languageContent : {};
//         const currentContent = JSON.parse(JSON.stringify(cfg.fields(doc)));
//         // Remember which locale is currently applied. For legacy records without
//         // locale metadata, translate the current text to English rather than
//         // assuming a previously saved `en` snapshot is truly English.
//         if (language === "en") {
//           if (state.currentLanguage && state.currentLanguage !== "en") {
//             state.en = await translateStructuredContent(currentContent, "en");
//           } else if (!state.currentLanguage) {
//             state.en = await translateStructuredContent(currentContent, "en");
//           } else if (!state.en) {
//             state.en = currentContent;
//           }
//           cfg.apply(doc, state.en || currentContent);
//         } else {
//           if (!state.en) {
//             state.en = state.currentLanguage && state.currentLanguage !== "en"
//               ? await translateStructuredContent(currentContent, "en")
//               : currentContent;
//           }
//           if (!state[language]) state[language] = await translateStructuredContent(state.en, language);
//           cfg.apply(doc, state[language]);
//         }
//         state.currentLanguage = language;
//         doc.languageContent = state;
//         await doc.save();
//         result.translated++;
//       } catch (err) {
//         result.errors++;
//         console.error(`[Translation] ${cfg.Model.modelName} ${doc._id}: ${err.message}`);
//       }
//     }
//   }
//   return result;
// }



```javascript
import Prescription from "../models/Prescription.js";
import Medicine from "../models/Medicine.js";

const LANGS = new Set(["en", "hi", "gu"]);

/**
 * Language change only updates the user's selected language.
 *
 * Existing prescription interactions and medicine AI analysis
 * must NOT be automatically translated.
 *
 * Translation should happen only when the user explicitly
 * regenerates the analysis using the selected language.
 */
export async function syncUserLanguage(userId, language) {
  if (!LANGS.has(language)) {
    throw new Error("Unsupported language");
  }

  // Intentionally do not modify existing prescription or
  // medicine analysis when the user changes the language.

  const [prescriptions, medicines] = await Promise.all([
    Prescription.countDocuments({ user: userId }),
    Medicine.countDocuments({ user: userId }),
  ]);

  return {
    language,
    translated: 0,
    skipped: prescriptions + medicines,
    errors: 0,
    message:
      "Language preference updated. Existing AI analyses remain unchanged until manually regenerated.",
  };
}
```