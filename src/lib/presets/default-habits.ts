import type { TrackingType } from "@/src/lib/types/habit"
import type { SupabaseClient } from "@supabase/supabase-js"

type PresetHabit = {
  title: string
  tracking_type: TrackingType
  target_value?: number
  unit?: string
}

type PresetCategory = {
  name: string
  habits: PresetHabit[]
}

export const DEFAULT_PRESETS: PresetCategory[] = [
  {
    name: "Prayers",
    habits: [
      { title: "Fajr", tracking_type: "checkbox" },
      { title: "Dhuhr", tracking_type: "checkbox" },
      { title: "Asr", tracking_type: "checkbox" },
      { title: "Maghrib", tracking_type: "checkbox" },
      { title: "Isha", tracking_type: "checkbox" },
    ],
  },
  {
    name: "Workout",
    habits: [
      { title: "Pull Ups", tracking_type: "numeric", target_value: 10, unit: "reps" },
      { title: "Pushups", tracking_type: "numeric", target_value: 20, unit: "reps" },
    ],
  },
  {
    name: "Personality",
    habits: [
      { title: "English Communication", tracking_type: "checkbox" },
      { title: "Confidence Improvement", tracking_type: "checkbox" },
    ],
  },
]

/**
 * Inserts preset categories and habits for a user. Each user gets their own copy
 * so they can edit and delete. Gets or creates each category by name, then ensures
 * all preset habits exist in that category (inserts missing ones).
 */
export async function seedDefaultHabitsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: maxRow } = await supabase
      .from("habits")
      .select("order_index")
      .eq("user_id", userId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle()
    let nextOrderIndex = (maxRow?.order_index ?? -1) + 1

    for (const preset of DEFAULT_PRESETS) {
      let categoryId: string

      const { data: existingCat } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .eq("name", preset.name)
        .maybeSingle()

      if (existingCat?.id) {
        categoryId = existingCat.id
      } else {
        const { data: newCat, error: catError } = await supabase
          .from("categories")
          .insert({ user_id: userId, name: preset.name })
          .select("id")
          .single()
        if (catError || !newCat) {
          return { ok: false, error: catError?.message ?? "Failed to create category" }
        }
        categoryId = newCat.id
      }

      const { data: existingHabits } = await supabase
        .from("habits")
        .select("title")
        .eq("user_id", userId)
        .eq("category_id", categoryId)
      const existingTitles = new Set((existingHabits ?? []).map((h) => h.title))

      for (const habit of preset.habits) {
        if (existingTitles.has(habit.title)) continue
        const { error: habitError } = await supabase.from("habits").insert({
          user_id: userId,
          category_id: categoryId,
          title: habit.title,
          tracking_type: habit.tracking_type,
          order_index: nextOrderIndex,
          ...(habit.target_value != null && { target_value: habit.target_value }),
          ...(habit.unit != null && habit.unit !== "" && { unit: habit.unit }),
        })
        if (habitError) {
          return { ok: false, error: habitError.message }
        }
        nextOrderIndex++
        existingTitles.add(habit.title)
      }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}
