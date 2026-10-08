// In-memory fake of the expo-notifications surface the app uses. It
// mirrors the documented platform rule that CALENDAR triggers are iOS-only
// (that is what broke Android), and that re-using an identifier replaces.
const state = (globalThis.__notif ||= {
  permission: { status: "undetermined", canAskAgain: true },
  nextPromptResult: "granted",
  scheduled: new Map(),
  channels: new Map(),
  promptCount: 0,
  failScheduleFor: null,
  handler: null,
});

export const AndroidImportance = { HIGH: 4 };
export const AndroidNotificationVisibility = { PUBLIC: 1 };
export const SchedulableTriggerInputTypes = { CALENDAR: "calendar", DAILY: "daily", DATE: "date" };

export function setNotificationHandler(h) { state.handler = h; }
export async function setNotificationChannelAsync(id, cfg) { state.channels.set(id, cfg); }
export async function getPermissionsAsync() { return { ...state.permission }; }
export async function requestPermissionsAsync() {
  if (globalThis.__platform === "android" && state.channels.size === 0) {
    throw new Error("Android 13 prompt requires a notification channel first");
  }
  state.promptCount += 1;
  state.permission = {
    status: state.nextPromptResult,
    canAskAgain: state.nextPromptResult !== "denied" ? true : false,
  };
  return { ...state.permission };
}
export async function scheduleNotificationAsync({ identifier, content, trigger }) {
  const os = globalThis.__platform || "android";
  if (trigger.type === "calendar" && os === "android") {
    throw new Error("Calendar trigger is not supported on Android");
  }
  if (state.failScheduleFor && identifier.includes(state.failScheduleFor)) {
    throw new Error("simulated scheduling failure");
  }
  const id = identifier || crypto.randomUUID();
  state.scheduled.set(id, { identifier: id, content, trigger });
  return id;
}
export async function getAllScheduledNotificationsAsync() { return [...state.scheduled.values()]; }
export async function cancelScheduledNotificationAsync(id) { state.scheduled.delete(id); }
export async function getLastNotificationResponseAsync() { return null; }
export function addNotificationResponseReceivedListener() { return { remove() {} }; }
