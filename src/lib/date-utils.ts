export function getTodayKey(): string {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function formatDayAndDate(date: Date = new Date()): { day: string; dateLine: string } {
  const day = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const dayNum = date.getDate()
  const dateLine = `${month} ${getOrdinal(dayNum)}`
  return { day, dateLine }
}

export function getDateKey(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

/** Returns array of date keys for the last N days (including today). */
export function getDateRangeForLastDays(days: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    keys.push(getDateKey(d))
  }
  return keys
}

export function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Get Monday of the week for this date (ISO week) for grouping. Returns YYYY-MM-DD. */
export function getWeekStartKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return getDateKey(date)
}
