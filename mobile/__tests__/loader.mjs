// Test-only ESM loader: maps React Native / Expo packages to in-memory
// mocks and resolves extensionless relative imports like Metro does.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const MOCKS = {
  "expo-notifications": "./mocks/expo-notifications.mjs",
  "react-native": "./mocks/react-native.mjs",
  "@react-native-async-storage/async-storage": "./mocks/async-storage.mjs",
};

export async function resolve(specifier, context, next) {
  if (MOCKS[specifier]) {
    return { url: new URL(MOCKS[specifier], import.meta.url).href, shortCircuit: true, format: "module" };
  }
  if (specifier.startsWith(".") && context.parentURL && !path.extname(specifier)) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    if (existsSync(base + ".js")) {
      return { url: pathToFileURL(base + ".js").href, shortCircuit: true, format: "module" };
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith(".js") && !url.includes("node_modules")) {
    return next(url, { ...context, format: "module" });
  }
  return next(url, context);
}
