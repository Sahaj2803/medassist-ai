// Dependency-free translation core (no React, no React Native imports) so it
// can be unit-tested with plain `node --test` and reused by any screen.
//
// Public API:
//   SUPPORTED_LANGUAGE_CODES, DEFAULT_LANGUAGE
//   isSupportedLanguage(code)      -> boolean
//   normalizeLanguage(code)        -> "en" | "hi" | "gu" (invalid -> "en")
//   translate(language, key, params?) -> string
//
// translate() never throws and never returns undefined/empty for a bad key:
//   1. key found in the requested language        -> that string
//   2. otherwise key found in English             -> English string
//   3. otherwise                                  -> the key itself
//      (visible in dev, harmless in prod, and obviously not a crash)
import en from "./en.js";
import hi from "./hi.js";
import gu from "./gu.js";

export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGE_CODES = ["en", "hi", "gu"];

const DICTIONARIES = { en, hi, gu };

export function isSupportedLanguage(code) {
  return typeof code === "string" && Object.prototype.hasOwnProperty.call(DICTIONARIES, code);
}

export function normalizeLanguage(code) {
  return isSupportedLanguage(code) ? code : DEFAULT_LANGUAGE;
}

export function getDictionary(code) {
  return DICTIONARIES[normalizeLanguage(code)];
}

function lookup(dict, key) {
  // Dictionaries use flat dotted keys ("profile.language"); nested objects
  // are also supported so either layout works.
  if (Object.prototype.hasOwnProperty.call(dict, key)) {
    const flat = dict[key];
    return typeof flat === "string" && flat.length > 0 ? flat : undefined;
  }
  let node = dict;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object" || !Object.prototype.hasOwnProperty.call(node, part)) {
      return undefined;
    }
    node = node[part];
  }
  return typeof node === "string" && node.length > 0 ? node : undefined;
}

function interpolate(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) && params[name] != null
      ? String(params[name])
      : match
  );
}

export function translate(language, key, params) {
  if (typeof key !== "string" || key.length === 0) return "";
  const text =
    lookup(getDictionary(language), key) ?? lookup(DICTIONARIES[DEFAULT_LANGUAGE], key) ?? key;
  return interpolate(text, params);
}

export default { translate, normalizeLanguage, isSupportedLanguage, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES };
