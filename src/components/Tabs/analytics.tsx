"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import Header from "../layout/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { supabase } from "@/src/lib/supabase/client"
import type { Habit } from "@/src/lib/types/habit"
import {
  getTodayKey,
  getDateRangeForLastDays,
  formatShortDate,
  getWeekStartKey,
} from "@/src/lib/date-utils"
import { TrendingUp, Target, CheckCircle2, Flame } from "lucide-react"
import Loader from "../loader"

type HabitCompletion = {
  id: string
  habit_id: string
  date: string
  value: number
  completed: boolean
}

/** Per-habit completion ratio 0–1 from a completion record (for analytics). */
function getCompletionRatio(habit: Habit, c: HabitCompletion): number {
  if (habit.tracking_type === "checkbox") return c.completed ? 1 : 0
  const target = habit.target_value ?? 8
  if (target <= 0) return 0
  return Math.min(1, c.value / target)
}

const RANGE_OPTIONS = [
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last month" },
  { value: "365", label: "Last year" },
]

const CHART_COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]

export default function Analytics() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [rangeDays, setRangeDays] = useState("7")
  const rangeDaysNum = Number(rangeDays)

  const dateRange = useMemo(
    () => getDateRangeForLastDays(rangeDaysNum),
    [rangeDaysNum]
  )

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setHabits([])
      setCompletions([])
      setLoading(false)
      return
    }
    const habitsRes = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
    const allHabits = habitsRes.data ?? []
    setHabits(allHabits.filter((h) => !h.archived))

    const completionsRes = await supabase
      .from("habit_completions")
      .select("id, habit_id, date, value, completed")
      .eq("user_id", user.id)
      .in("date", dateRange)
    if (completionsRes.error) {
      setCompletions([])
    } else {
      setCompletions(completionsRes.data ?? [])
    }
    setLoading(false)
  }, [dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const todayKey = getTodayKey()

  const stats = useMemo(() => {
    const totalHabits = habits.length
    const todayCompletions = completions.filter((c) => c.date === todayKey)
    let todayRatioSum = 0
    habits.forEach((h) => {
      const c = todayCompletions.find((x) => x.habit_id === h.id)
      todayRatioSum += c ? getCompletionRatio(h, c) : 0
    })
    const completedTodayPercent =
      totalHabits > 0 ? Math.round((todayRatioSum / totalHabits) * 100) : 0

    let totalRatioSum = 0
    dateRange.forEach((date) => {
      habits.forEach((h) => {
        const c = completions.find((x) => x.habit_id === h.id && x.date === date)
        totalRatioSum += c ? getCompletionRatio(h, c) : 0
      })
    })
    const totalPossible = totalHabits * dateRange.length
    const completionRate =
      totalPossible > 0 ? Math.round((totalRatioSum / totalPossible) * 100) : 0

    const byDateRatio: Record<string, number> = {}
    dateRange.forEach((d) => (byDateRatio[d] = 0))
    dateRange.forEach((date) => {
      habits.forEach((h) => {
        const c = completions.find((x) => x.habit_id === h.id && x.date === date)
        byDateRatio[date] += c ? getCompletionRatio(h, c) : 0
      })
    })
    let chartData: { date: string; fullDate: string; rate: number }[]
    if (dateRange.length > 31) {
      const byWeek: Record<string, { sum: number; count: number }> = {}
      dateRange.forEach((date) => {
        const weekKey = getWeekStartKey(date)
        if (!byWeek[weekKey]) byWeek[weekKey] = { sum: 0, count: 0 }
        byWeek[weekKey].sum += byDateRatio[date] ?? 0
        byWeek[weekKey].count += totalHabits
      })
      const weekKeys = Object.keys(byWeek).sort()
      chartData = weekKeys.map((weekKey) => {
        const w = byWeek[weekKey]
        return {
          date: "Week of " + formatShortDate(weekKey),
          fullDate: weekKey,
          rate: w.count ? Math.round((w.sum / w.count) * 100) : 0,
        }
      })
    } else {
      chartData = dateRange.map((date) => ({
        date: formatShortDate(date),
        fullDate: date,
        rate:
          totalHabits > 0
            ? Math.round(((byDateRatio[date] ?? 0) / totalHabits) * 100)
            : 0,
      }))
    }

    const byHabitRatio: Record<string, number> = {}
    habits.forEach((h) => (byHabitRatio[h.id] = 0))
    dateRange.forEach((date) => {
      habits.forEach((h) => {
        const c = completions.find((x) => x.habit_id === h.id && x.date === date)
        byHabitRatio[h.id] += c ? getCompletionRatio(h, c) : 0
      })
    })
    const numDays = dateRange.length
    const habitChartData = habits
      .map((h) => ({
        name: h.title.length > 12 ? h.title.slice(0, 12) + "…" : h.title,
        fullName: h.title,
        rate: numDays > 0 ? Math.round(((byHabitRatio[h.id] ?? 0) / numDays) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10)

    let streak = 0
    for (let i = dateRange.length - 1; i >= 0; i--) {
      const d = dateRange[i]
      const completedThatDay = completions.filter(
        (c) => c.date === d && c.completed
      ).length
      if (totalHabits > 0 && completedThatDay === totalHabits) streak++
      else break
    }

    return {
      totalHabits,
      completedTodayPercent,
      completionRate,
      chartData,
      habitChartData,
      streak,
    }
  }, [habits, completions, dateRange, todayKey])

  return (
    <>
      <Header>
        <p className="text-lg font-semibold">Analytics</p>
      </Header>

      <div className="pt-20 pb-24 px-4 max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Date range</p>
          <Select value={rangeDays} onValueChange={setRangeDays}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <Target className="h-3.5 w-3.5" />
                    Total habits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalHabits}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Progress today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-violet-600">
                    {stats.completedTodayPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">average completion</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Completion rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">in selected range</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    Current streak
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.streak} day{stats.streak !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress by day</CardTitle>
                <CardDescription>
                  Average completion % per day in the selected range
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No data yet. Complete habits on the Today tab to see trends.
                  </p>
                ) : (
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.chartData}
                        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          domain={[0, 100]}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          width={24}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null
                            const d = payload[0].payload
                            return (
                              <div className="rounded-md border bg-background px-3 py-2 text-sm shadow">
                                <p className="font-medium">{d.fullDate}</p>
                                <p className="text-muted-foreground">
                                  {d.rate}% avg completion
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="rate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top habits</CardTitle>
                <CardDescription>
                  Average daily progress % in the selected range
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.habitChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No completions yet.
                  </p>
                ) : (
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.habitChartData}
                        layout="vertical"
                        margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} allowDecimals={false} tick={{ fontSize: 11 }} unit="%" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={80}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null
                            const d = payload[0].payload
                            return (
                              <div className="rounded-md border bg-background px-3 py-2 text-sm shadow">
                                <p className="font-medium">{d.fullName}</p>
                                <p className="text-muted-foreground">
                                  {d.rate}% avg daily progress
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={24}>
                          {stats.habitChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
