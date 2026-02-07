export type TrackingType = 'checkbox' | 'numeric' | 'duration'

export type Habit = {
  id: string
  user_id: string
  title: string
  tracking_type: TrackingType
  target_value: number | null
  unit: string | null
  category_id?: string | null
  archived?: boolean
  created_at: string
}

export type HabitInsert = {
  user_id: string
  title: string
  tracking_type: TrackingType
  target_value?: number | null
  unit?: string | null
  category_id?: string | null
}

export type Category = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type CategoryInsert = {
  user_id: string
  name: string
}
