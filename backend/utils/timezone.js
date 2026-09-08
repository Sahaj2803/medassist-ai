import { env } from "../config/env.js";

export const APP_TIMEZONE = env.APP_TIMEZONE || "Asia/Kolkata";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function getParts(date) {
  const parts = formatter.formatToParts(date);
  const result = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  }

  return result;
}

export function currentHHmm(date = new Date()) {
  const parts = getParts(date);
  return `${parts.hour}:${parts.minute}`;
}

export function todayAt(timeStr, base = new Date()) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const parts = getParts(base);

  const dateString = `${parts.year}-${parts.month}-${parts.day}`;

  // Get the timezone offset for this exact date.
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    timeZoneName: "longOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const offsetPart = offsetFormatter
    .formatToParts(base)
    .find((part) => part.type === "timeZoneName");

  let offset = offsetPart?.value || "GMT+00:00";

  // Convert "GMT+05:30" -> "+05:30"
  offset = offset.replace("GMT", "");

  if (offset === "") {
    offset = "+00:00";
  }

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");

  return new Date(`${dateString}T${hh}:${mm}:00${offset}`);
}

export function startOfToday(base = new Date()) {
  return todayAt("00:00", base);
}

export function endOfToday(base = new Date()) {
  const start = todayAt("00:00", base);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}