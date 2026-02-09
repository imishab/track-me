import { NextResponse } from "next/server"
import {
  getPrayerAtNow,
  getTodayInPrayerTimezone,
  PRAYER_TIMES,
  type PrayerKey,
} from "@/src/lib/prayer-times"
import { sendPushAlert } from "@/src/lib/pushalert"
import { createServerSupabaseClient } from "@/src/lib/supabase/server"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://track-me-two-sage.vercel.app"

/**
 * Vercel Cron calls this every minute. If current time (in prayer timezone) matches
 * a prayer time, sends one push via PushAlert and records it in Supabase so we don't send twice.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prayerKey = getPrayerAtNow()
  if (!prayerKey) {
    return NextResponse.json({ ok: true, message: "No prayer at this time" })
  }

  const date = getTodayInPrayerTimezone()
  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return NextResponse.json(
      { error: "Server config missing (Supabase service role)" },
      { status: 503 }
    )
  }

  const { data: existing } = await supabase
    .from("prayer_notification_sent")
    .select("id")
    .eq("date", date)
    .eq("prayer_key", prayerKey)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, message: "Already sent today", prayer: prayerKey })
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

  return NextResponse.json({
    ok: true,
    sent: true,
    prayer: prayerKey,
    notificationId: result.id,
  })
}
