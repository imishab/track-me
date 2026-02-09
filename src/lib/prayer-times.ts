/**
 * Prayer times for push notifications (fixed times, one timezone).
 * Times are in 24h: Fajr 5:30, Dhuhr 12:45, Asr 16:00, Maghrib 18:45, Isha 20:00.
 */

export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha"

export const PRAYER_TIMES: Record<
  PrayerKey,
  { name: string; hour: number; minute: number }
> = {
  fajr: { name: "Fajr", hour: 5, minute: 30 },
  dhuhr: { name: "Dhuhr", hour: 12, minute: 45 },
  asr: { name: "Asr", hour: 16, minute: 0 },
  maghrib: { name: "Maghrib", hour: 18, minute: 45 },
  isha: { name: "Isha", hour: 20, minute: 0 },
}

/** Default timezone for prayer times (e.g. "Asia/Kolkata"). Override with PRAYER_TIMEZONE env. */
export const PRAYER_TIMEZONE = process.env.PRAYER_TIMEZONE ?? "Asia/Kolkata"

/**
 * Returns the prayer key whose time matches the given date in the prayer timezone, or null.
 */
export function getPrayerAtNow(now: Date = new Date()): PrayerKey | null {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAYER_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10)
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10)

  for (const [key, config] of Object.entries(PRAYER_TIMES) as Array<[PrayerKey, (typeof PRAYER_TIMES)[PrayerKey]]>) {
    if (config.hour === hour && config.minute === minute) return key
  }
  return null
}

/**
 * Returns today's date string (YYYY-MM-DD) in the prayer timezone.
 */
export function getTodayInPrayerTimezone(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAYER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = formatter.formatToParts(now)
  const y = parts.find((p) => p.type === "year")?.value ?? "0000"
  const m = parts.find((p) => p.type === "month")?.value ?? "01"
  const d = parts.find((p) => p.type === "day")?.value ?? "01"
  return `${y}-${m}-${d}`
}

/** Whether it's 9:00 PM in the prayer timezone (for daily summary). */
export function isDailySummaryTime(now: Date = new Date()): boolean {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAYER_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10)
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10)
  return hour === 21 && minute === 0
}
