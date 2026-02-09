import type { SupabaseClient } from "@supabase/supabase-js"
import { sendPushAlertToSubscriber } from "./pushalert"
import { getTodayInPrayerTimezone } from "./prayer-times"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://track-me-two-sage.vercel.app"

type HabitRow = {
  id: string
  tracking_type: string
  target_value: number | null
  archived?: boolean
}
type CompletionRow = { habit_id: string; value: number; completed: boolean }

/**
 * Compute today's habit completion % for a user (same logic as Today tab).
 * Returns 0–100 or null if no habits.
 */
export function computeDailyCompletionPercent(
  habits: HabitRow[],
  completions: CompletionRow[]
): number | null {
  const active = habits.filter((h) => !h.archived)
  if (active.length === 0) return null
  let sum = 0
  for (const habit of active) {
    const c = completions.find((x) => x.habit_id === habit.id)
    let ratio: number
    if (habit.tracking_type === "checkbox") {
      ratio = c?.completed ? 1 : 0
    } else {
      const target = habit.target_value ?? 1
      const val = c?.value ?? 0
      ratio = target <= 0 ? 0 : Math.min(1, val / target)
    }
    sum += ratio
  }
  return Math.round((sum / active.length) * 100)
}

/**
 * Run daily summary: for each user with a push subscription, compute today's % and send one push.
 * Uses service-role Supabase. Skips users already in daily_summary_sent for today.
 */
export async function runDailySummary(supabase: SupabaseClient): Promise<{ sent: number; errors: string[] }> {
  const date = getTodayInPrayerTimezone()
  const errors: string[] = []
  let sent = 0

  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("user_id, subscriber_id")
  if (subsError || !subs?.length) {
    return { sent: 0, errors: subsError ? [subsError.message] : [] }
  }

  for (const { user_id, subscriber_id } of subs) {
    const { data: already } = await supabase
      .from("daily_summary_sent")
      .select("id")
      .eq("date", date)
      .eq("user_id", user_id)
      .maybeSingle()
    if (already) continue

    const { data: habits } = await supabase
      .from("habits")
      .select("id, tracking_type, target_value, archived")
      .eq("user_id", user_id)
    const habitList = (habits ?? []) as HabitRow[]

    const { data: comps } = await supabase
      .from("habit_completions")
      .select("habit_id, value, completed")
      .eq("user_id", user_id)
      .eq("date", date)
    const compList = (comps ?? []) as CompletionRow[]

    const pct = computeDailyCompletionPercent(habitList, compList)
    const title = "Today's habit summary"
    const message =
      pct != null
        ? `You completed ${pct}% of your habits today. Open TrackMe to see details.`
        : "Open TrackMe to track your habits."

    const result = await sendPushAlertToSubscriber(subscriber_id, {
      title,
      message,
      url: APP_URL,
      icon: `${APP_URL}/images/icons/192.png`,
    })
    if (!result.success) {
      errors.push(`user ${user_id}: ${result.error}`)
      continue
    }
    await supabase.from("daily_summary_sent").insert({ date, user_id })
    sent++
  }
  return { sent, errors }
}
