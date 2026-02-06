export type TrackingType = 'checkbox' | 'numeric' | 'duration'

export type Habit = {
  id: string
  user_id: string
  title: string
  tracking_type: TrackingType
  target_value: number | null
  unit: string | null
  created_at: string
}

export type HabitInsert = {
  user_id: string
  title: string
  tracking_type: TrackingType
  target_value?: number | null
  unit?: string | null
}
