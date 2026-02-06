"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus } from 'lucide-react'
import Header from '../layout/Header'
import { Button } from '../ui/button'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '../ui/drawer'
import { Progress } from '../ui/progress'
import HabitCards from '../Today/HabitCards'
import { FieldDemo, type NewHabitData } from '../ui/FieldDemo'
import { ScrollArea } from '../ui/scroll-area'
import { supabase } from '@/src/lib/supabase/client'
import type { Habit } from '@/src/lib/types/habit'
import { getTodayKey, formatDayAndDate } from '@/src/lib/date-utils'

const STORAGE_KEY_PREFIX = 'track-me-daily'

type DayCompletion = { value: number; checked: boolean }

function loadDailyCompletionsFromStorage(): Record<string, DayCompletion> {
  if (typeof window === 'undefined') return {}
  try {
    const key = getTodayKey()
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}-${key}`)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function isHabitCompleted(habit: Habit, data: DayCompletion | undefined): boolean {
  if (!data) return false
  if (habit.tracking_type === 'checkbox') return data.checked
  const target = habit.target_value ?? 8
  return data.value >= target
}

export default function Today() {
    const [open, setOpen] = useState(false)
    const [habits, setHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)
    const [dailyCompletions, setDailyCompletions] = useState<Record<string, DayCompletion>>(loadDailyCompletionsFromStorage)
    const [dateKey] = useState(() => getTodayKey())

    const { day, dateLine } = useMemo(() => formatDayAndDate(), [])

    const fetchHabits = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setHabits([])
            setLoading(false)
            return
        }
        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        if (error) {
            setHabits([])
        } else {
            const list = data ?? []
            setHabits(list.filter((h) => !h.archived))
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchHabits()
    }, [fetchHabits])

    // Persist completions whenever they change (initial state is from localStorage so we never overwrite with empty)
    useEffect(() => {
        try {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}-${dateKey}`, JSON.stringify(dailyCompletions))
        } catch {
            // ignore
        }
    }, [dateKey, dailyCompletions])

    const completedCount = useMemo(
        () => habits.filter((h) => isHabitCompleted(h, dailyCompletions[h.id])).length,
        [habits, dailyCompletions]
    )
    const progressPercent = habits.length ? Math.round((completedCount / habits.length) * 100) : 0

    const handleCompletionChange = useCallback((habitId: string, data: DayCompletion) => {
        setDailyCompletions((prev) => ({ ...prev, [habitId]: data }))
    }, [])

    async function handleAddHabit(formData: NewHabitData) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { error } = await supabase.from('habits').insert({
            user_id: user.id,
            title: formData.title,
            tracking_type: formData.tracking_type,
            ...(formData.target_value != null && { target_value: formData.target_value }),
            ...(formData.unit != null && formData.unit !== '' && { unit: formData.unit }),
        })
        if (error) return
        setOpen(false)
        await fetchHabits()
    }

    return (
        <>
            <Header height='h-24'>
                <div className='flex flex-col w-full mt-5'>
                    <div className='flex items-center justify-between w-full'>
                        <div className="flex flex-col">
                            <p className="text-md font-semibold text-violet-400">{day}</p>
                            <p className="text-xl font-bold">{dateLine}</p>
                        </div>
                        <div className='flex flex-col items-center '>
                            <h1 className='text-xl font-black text-violet-400'>{progressPercent}%</h1>
                            <p className='text-xs text-gray-500'>Completed</p>
                        </div>
                    </div>
                    <Progress value={progressPercent} className='mt-4 mb-5' />
                </div>
            </Header>

            <div className="flex-1 overflow-y-auto space-y-4 max-w-md mx-auto pt-28 pb-24 px-4">
                {loading ? (
                    <p className="text-muted-foreground text-sm">Loading habits…</p>
                ) : habits.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No habits yet. Tap + New Habit to add one.</p>
                ) : (
                    habits.map((habit) => (
                        <HabitCards
                            key={habit.id}
                            habit={habit}
                            value={dailyCompletions[habit.id]?.value ?? 0}
                            checked={dailyCompletions[habit.id]?.checked ?? false}
                            onCompletionChange={(data) => handleCompletionChange(habit.id, data)}
                        />
                    ))
                )}
            </div>

            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Button
                        className="fixed bottom-28 right-4 z-40 h-10 rounded-full text-white bg-violet-500 px-6 shadow-lg hover:bg-violet-600"
                        size="lg"
                    >
                        <Plus className="h-5 w-5" />
                        New Habit
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Create New Habit</DrawerTitle>
                        <DrawerDescription>
                            Add a new habit to track daily.
                        </DrawerDescription>
                    </DrawerHeader>
                    <ScrollArea className="h-[34vh] w-full">
                        <div className="px-4">
                            <FieldDemo onSubmit={handleAddHabit} formId="new-habit-form" />
                        </div>
                    </ScrollArea>
                    <DrawerFooter className='mb-4 flex justify-between'>
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                        <Button type="submit" form="new-habit-form" className="bg-violet-500 text-white hover:bg-violet-600">
                            Add Habit
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    )
}