import { NextResponse } from "next/server"
import {
  getPrayerAtNow,
  getTodayInPrayerTimezone,
  PRAYER_TIMES,
  isDailySummaryTime,
  type PrayerKey,
} from "@/src/lib/prayer-times"
import { runDailySummary } from "@/src/lib/daily-summary"
import { sendPushAlert } from "@/src/lib/pushalert"
import { createServerSupabaseClient } from "@/src/lib/supabase/server"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://track-me-two-sage.vercel.app"

const VALID_PRAYER_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"]

/**
 * Vercel Cron calls this every minute.
 * - At 9:00 PM (prayer timezone): send daily habit summary to each subscribed user.
 * - At prayer times: send prayer reminder to all subscribers.
 * Test: ?test=fajr for prayer; ?test=daily for daily summary.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const testParam = searchParams.get("test")?.toLowerCase()

  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return NextResponse.json(
      { error: "Server config missing (Supabase service role)" },
      { status: 503 }
    )
  }

  if (testParam === "daily") {
    const { sent, errors } = await runDailySummary(supabase)
    return NextResponse.json({ ok: true, test: true, dailySummary: true, sent, errors })
  }

  const isTestPrayer = testParam && VALID_PRAYER_KEYS.includes(testParam as PrayerKey)
  const prayerKey: PrayerKey | null = isTestPrayer ? (testParam as PrayerKey) : getPrayerAtNow()

  if (!prayerKey && !isDailySummaryTime()) {
    return NextResponse.json({ ok: true, message: "No prayer or daily summary at this time" })
  }

  if (isDailySummaryTime() && !isTestPrayer) {
    const { sent, errors } = await runDailySummary(supabase)
    return NextResponse.json({ ok: true, dailySummary: true, sent, errors })
  }

  if (!prayerKey) {
    return NextResponse.json({ ok: true, message: "No prayer at this time" })
  }

  const date = getTodayInPrayerTimezone()

  if (!isTestPrayer) {
    const { data: existing } = await supabase
      .from("prayer_notification_sent")
      .select("id")
      .eq("date", date)
      .eq("prayer_key", prayerKey)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ ok: true, message: "Already sent today", prayer: prayerKey })
    }
  }

  const config = PRAYER_TIMES[prayerKey as PrayerKey]
  const title = `${config.name} prayer time`
  const message = `It's ${config.name} — time to pray. Open TrackMe to log it.`
  const result = await sendPushAlert({
    title,
    message,
    url: APP_URL,
    icon: `${APP_URL}/images/icons/192.png`,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: "PushAlert send failed", detail: result.error },
      { status: 502 }
    )
  }

  if (!isTestPrayer) {
    const { error: insertError } = await supabase.from("prayer_notification_sent").insert({
      date,
      prayer_key: prayerKey,
    })
    if (insertError?.code === "23505") {
      return NextResponse.json({ ok: true, message: "Already sent today (race)", prayer: prayerKey })
    }
    if (insertError) {
      return NextResponse.json({ error: "Failed to record sent", detail: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    sent: true,
    prayer: prayerKey,
    notificationId: result.id,
    ...(isTestPrayer && { test: true }),
  })
}
