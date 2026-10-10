import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createLanguageStore } from "../i18n/languageStore.js";
import { createLanguageStorage, LANGUAGE_STORAGE_KEY } from "../i18n/languageStorage.js";

// In-memory AsyncStorage double; `delay` lets tests force slow reads.
function fakeAsyncStorage(initial = {}, { readDelay = 0, failReads = false, failWrites = false } = {}) {
  const data = { ...initial };
  return {
    data,
    async getItem(k) {
      if (readDelay) await new Promise((r) => setTimeout(r, readDelay));
      if (failReads) throw new Error("read fail");
      return k in data ? data[k] : null;
    },
    async setItem(k, v) { if (failWrites) throw new Error("write fail"); data[k] = v; },
    async removeItem(k) { delete data[k]; },
  };
}
const make = (initial, opts) => {
  const as = fakeAsyncStorage(initial, opts);
  const store = createLanguageStore({ storage: createLanguageStorage(as) });
  return { as, store };
};

describe("languageStorage adapter", () => {
  test("ignores invalid stored values and tolerates read errors", async () => {
    assert.equal(await createLanguageStorage(fakeAsyncStorage({ [LANGUAGE_STORAGE_KEY]: "fr" })).get(), null);
    assert.equal(await createLanguageStorage(fakeAsyncStorage({}, { failReads: true })).get(), null);
    assert.equal(await createLanguageStorage(fakeAsyncStorage({ [LANGUAGE_STORAGE_KEY]: "gu" })).get(), "gu");
  });
  test("does not write invalid codes", async () => {
    const as = fakeAsyncStorage();
    await createLanguageStorage(as).set("fr");
    assert.deepEqual(as.data, {});
  });
});

describe("initialisation + persistence", () => {
  test("starts as en, not ready; init restores valid stored language", async () => {
    const { store } = make({ [LANGUAGE_STORAGE_KEY]: "hi" });
    assert.deepEqual(store.getSnapshot(), { language: "en", ready: false });
    await store.init();
    assert.deepEqual(store.getSnapshot(), { language: "hi", ready: true });
  });
  test("invalid stored value -> en, ready", async () => {
    const { store } = make({ [LANGUAGE_STORAGE_KEY]: "klingon" });
    await store.init();
    assert.deepEqual(store.getSnapshot(), { language: "en", ready: true });
  });
  test("storage read failure -> en, still ready", async () => {
    const { store } = make({}, { failReads: true });
    await store.init();
    assert.deepEqual(store.getSnapshot(), { language: "en", ready: true });
  });
  test("init is idempotent", async () => {
    const { store } = make({ [LANGUAGE_STORAGE_KEY]: "gu" });
    assert.equal(store.init(), store.init());
    await store.init();
    assert.equal(store.getSnapshot().language, "gu");
  });
  test("setLanguage updates state, notifies subscribers, persists", async () => {
    const { as, store } = make();
    await store.init();
    let calls = 0;
    const off = store.subscribe(() => calls++);
    assert.equal(await store.setLanguage("gu"), true);
    assert.equal(store.getSnapshot().language, "gu");
    assert.equal(as.data[LANGUAGE_STORAGE_KEY], "gu");
    assert.ok(calls >= 1);
    off();
    const before = calls;
    await store.setLanguage("hi");
    assert.equal(calls, before); // unsubscribed listener is not called
  });
  test("setLanguage with unsupported code is rejected and changes nothing", async () => {
    const { as, store } = make({ [LANGUAGE_STORAGE_KEY]: "hi" });
    await store.init();
    assert.equal(await store.setLanguage("fr"), false);
    assert.equal(store.getSnapshot().language, "hi");
    assert.equal(as.data[LANGUAGE_STORAGE_KEY], "hi");
  });
  test("a write failure does not break in-memory state", async () => {
    const { store } = make({}, { failWrites: true });
    await store.init();
    await store.setLanguage("hi");
    assert.equal(store.getSnapshot().language, "hi");
  });
  test("persisted value is restored by a brand-new store (app restart)", async () => {
    const as = fakeAsyncStorage();
    const s1 = createLanguageStore({ storage: createLanguageStorage(as) });
    await s1.init();
    await s1.setLanguage("gu");
    const s2 = createLanguageStore({ storage: createLanguageStorage(as) });
    await s2.init();
    assert.equal(s2.getSnapshot().language, "gu");
  });
  test("rapid changes: last one wins in memory and in storage", async () => {
    const { as, store } = make();
    await store.init();
    await Promise.all([store.setLanguage("hi"), store.setLanguage("gu"), store.setLanguage("en")]);
    assert.equal(store.getSnapshot().language, "en");
    assert.equal(as.data[LANGUAGE_STORAGE_KEY], "en");
  });
});

describe("race: slow startup read vs. early changes", () => {
  test("account language applied before the stored read resolves is NOT overwritten", async () => {
    const { store } = make({ [LANGUAGE_STORAGE_KEY]: "hi" }, { readDelay: 30 });
    const initDone = store.init();            // slow read of "hi" in flight
    await store.applyAccountLanguage("gu");   // auth restores account first
    await initDone;
    assert.deepEqual(store.getSnapshot(), { language: "gu", ready: true });
  });
  test("user pick before the stored read resolves is NOT overwritten", async () => {
    const { store } = make({ [LANGUAGE_STORAGE_KEY]: "hi" }, { readDelay: 30 });
    const initDone = store.init();
    await store.setLanguage("gu");
    await initDone;
    assert.equal(store.getSnapshot().language, "gu");
  });
  test("English default never overwrites a valid saved language during init", async () => {
    const { as, store } = make({ [LANGUAGE_STORAGE_KEY]: "hi" }, { readDelay: 20 });
    await store.init();
    assert.equal(as.data[LANGUAGE_STORAGE_KEY], "hi"); // nothing wrote "en" meanwhile
    assert.equal(store.getSnapshot().language, "hi");
  });
});

describe("account language policy (auth integration, store level)", () => {
  test("login restores account language and persists it", async () => {
    const { as, store } = make();
    await store.init();
    await store.applyAccountLanguage("hi");
    assert.equal(store.getSnapshot().language, "hi");
    assert.equal(as.data[LANGUAGE_STORAGE_KEY], "hi");
  });
  test("account without a (valid) language falls back to en — does not keep previous language", async () => {
    for (const missing of [undefined, null, "", "fr"]) {
      const { store } = make();
      await store.init();
      await store.applyAccountLanguage("gu");   // user A
      await store.applyAccountLanguage(missing); // user B, no preference
      assert.equal(store.getSnapshot().language, "en", String(missing));
    }
  });
  test("device language survives sign-out/restart, but the next account's language always overrides it", async () => {
    const { as, store } = make();
    await store.init();
    await store.applyAccountLanguage("gu");    // user A signs in (Gujarati)
    // sign-out does not touch language: auth screens keep the device language
    const s2 = createLanguageStore({ storage: createLanguageStorage(as) });
    await s2.init();                            // app restart while signed out
    assert.equal(s2.getSnapshot().language, "gu");
    await s2.applyAccountLanguage("hi");        // user B signs in with Hindi
    assert.equal(s2.getSnapshot().language, "hi");
    assert.equal(as.data[LANGUAGE_STORAGE_KEY], "hi");
    await s2.applyAccountLanguage(undefined);   // user C, no preference
    assert.equal(s2.getSnapshot().language, "en"); // not A's or B's language
  });
});
