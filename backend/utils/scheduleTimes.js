/**
 * Converts a medicine's plain-language frequency (as produced by
 * Gemini Vision in ocrService.js, e.g. "Twice daily", "3x daily",
 * "At bedtime", "As needed") into a default list of "HH:mm" times to
 * schedule reminders for. Times are picked to spread doses sensibly
 * across a waking day.
 *
 * Returns an empty array for "as needed" medicines — those don't get
 * an automatic recurring schedule, only manual reminders if the user
 * adds one.
 */
export function defaultTimesForFrequency(frequency) {
  if (!frequency) return ["09:00"];

  const f = frequency.toLowerCase();

  if (/as needed|sos|prn/.test(f)) return [];
  if (/4x|four times|qid/.test(f)) return ["08:00", "12:00", "16:00", "20:00"];
  if (/3x|three times|tid/.test(f)) return ["08:00", "14:00", "20:00"];
  if (/twice|2x|bid|bd\b/.test(f)) return ["09:00", "21:00"];

  // Combined phrasing like "Once in the morning, night" (from a 1-0-1
  // schedule) must be checked before the standalone bedtime/night check
  // below — otherwise the word "night" alone would match that first and
  // this branch would never be reached.
  if (/morning/.test(f) && /afternoon|night/.test(f)) {
    const times = [];
    if (/morning/.test(f)) times.push("08:00");
    if (/afternoon/.test(f)) times.push("14:00");
    if (/night/.test(f)) times.push("20:00");
    return times;
  }

  if (/bedtime|night|hs\b/.test(f)) return ["22:00"];
  if (/once|1x|od\b/.test(f)) return ["09:00"];

  // Unrecognized shorthand — safe single daily default rather than none.
  return ["09:00"];
}

/**
 * Computes the end date for a reminder schedule from a start date and
 * a duration in days. Returns null (ongoing / no end date) if no
 * duration was specified.
 */
export function computeEndDate(startDate, durationDays) {
  if (!durationDays || durationDays <= 0) return null;
  const end = new Date(startDate);
  end.setDate(end.getDate() + durationDays);
  return end;
}

export default { defaultTimesForFrequency, computeEndDate };
