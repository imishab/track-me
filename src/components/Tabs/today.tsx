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
import { CategoryRadialChart } from '../charts/ChartRadial'
import HabitCards from '../Today/HabitCards'
import { FieldDemo, type NewHabitData } from '../ui/FieldDemo'
import { ScrollArea } from '../ui/scroll-area'
import { supabase } from '@/src/lib/supabase/client'
import type { Habit, Category } from '@/src/lib/types/habit'
import { getTodayKey, formatDayAndDate } from '@/src/lib/date-utils'
import Loader from '../loader'
import Image from 'next/image'

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

/** Per-habit completion ratio 0–1: checkbox = 0 or 1, numeric/duration = min(1, value/target). */
function getHabitCompletionRatio(habit: Habit, data: DayCompletion | undefined): number {
  if (!data) return 0
  if (habit.tracking_type === 'checkbox') return data.checked ? 1 : 0
  const target = habit.target_value ?? 8
  if (target <= 0) return 0
  return Math.min(1, data.value / target)
}

export default function Today() {
    const [open, setOpen] = useState(false)
    const [habits, setHabits] = useState<Habit[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [dailyCompletions, setDailyCompletions] = useState<Record<string, DayCompletion>>(loadDailyCompletionsFromStorage)
    const [dateKey] = useState(() => getTodayKey())

    const { day, dateLine } = useMemo(() => formatDayAndDate(), [])

    const fetchHabits = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setHabits([])
            setCategories([])
            setLoading(false)
            return
        }
        const [habitsRes, categoriesRes] = await Promise.all([
            supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
        ])
        if (habitsRes.error) {
            setHabits([])
        } else {
            const list = habitsRes.data ?? []
            setHabits(list.filter((h) => !h.archived))
        }
        setCategories(categoriesRes.error ? [] : (categoriesRes.data ?? []))
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchHabits()
    }, [fetchHabits])

    // Persist completions to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}-${dateKey}`, JSON.stringify(dailyCompletions))
        } catch {
            // ignore
        }
    }, [dateKey, dailyCompletions])

    // Sync today's completions to Supabase for analytics (table may not exist yet)
    useEffect(() => {
        if (habits.length === 0) return
        const sync = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            try {
                for (const habit of habits) {
                    const data = dailyCompletions[habit.id]
                    const value = data?.value ?? 0
                    const completed = isHabitCompleted(habit, data)
                    await supabase.from('habit_completions').upsert(
                        {
                            user_id: user.id,
                            habit_id: habit.id,
                            date: dateKey,
                            value,
                            completed,
                        },
                        { onConflict: 'habit_id,date' }
                    )
                }
            } catch {
                // habit_completions table may not exist yet
            }
        }
        sync()
    }, [dateKey, dailyCompletions, habits])

    const filteredHabits = useMemo(
        () =>
            selectedCategoryId == null
                ? habits
                : habits.filter((h) => h.category_id === selectedCategoryId),
        [habits, selectedCategoryId]
    )
    const globalProgressPercent = useMemo(() => {
        if (habits.length === 0) return 0
        const sum = habits.reduce(
            (acc, h) => acc + getHabitCompletionRatio(h, dailyCompletions[h.id]),
            0
        )
        return Math.round((sum / habits.length) * 100)
    }, [habits, dailyCompletions])

    const categoryCompletedCount = useMemo(
        () =>
            filteredHabits.filter((h) => isHabitCompleted(h, dailyCompletions[h.id])).length,
        [filteredHabits, dailyCompletions]
    )
    const selectedCategory = useMemo(
        () => (selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId) : null),
        [selectedCategoryId, categories]
    )

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
                            <h1 className='text-xl font-black text-violet-400'>{globalProgressPercent}%</h1>
                            <p className='text-xs text-gray-500'>Progress</p>
                        </div>
                    </div>
                    <Progress value={globalProgressPercent} className='mt-4 mb-5' />
                </div>
            </Header>

            <div className="flex-1 overflow-y-auto space-y-4 max-w-md mx-auto pt-28 pb-24 px-4">
                {loading ? (
                    <Loader />
                ) : habits.length === 0 ? (
                    <div className="text-muted-foreground text-center mt-16 text-sm flex flex-col items-center justify-center">
                        <Image
                            src="/images/icons/not.png"
                            alt="No habits"
                            width={150}
                            height={150}
                            className="mb-5"
                        />
                        <p className="text-muted-foreground text-sm">No habits yet. Tap + New Habit to add one.</p>
                    </div>
                ) : (
                    <>
                        {categories.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 -mx-1 scrollbar-none scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className={`shrink-0 snap-start ${selectedCategoryId === null ? 'bg-violet-500 hover:bg-violet-600 text-white' : ''}`}
                                    onClick={() => setSelectedCategoryId(null)}
                                >
                                    All
                                </Button>
                                {categories.map((cat) => (
                                    <Button
                                        key={cat.id}
                                        variant="outline"
                                        size="lg"
                                        className={`shrink-0 snap-start ${selectedCategoryId === cat.id ? 'bg-violet-500 hover:bg-violet-600 text-white' : ''}`}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </div>
                        )}
                        {filteredHabits.length === 0 ? (
                            <div className="text-muted-foreground text-center mt-16 text-sm flex flex-col items-center justify-center">
                                <Image
                                    src="/images/icons/not.png"
                                    alt="No habits"
                                    width={150}
                                    height={150}
                                    className="mb-5"
                                />
                                {selectedCategoryId ? 'No habits in this category.' : 'No habits yet.'}
                            </div>
                        ) : (
                            <>
                                {selectedCategory && (
                                    <>
                                    <div className="flex gap-2 items-center justify-left">
                                        <CategoryRadialChart
                                            completed={categoryCompletedCount}
                                            total={filteredHabits.length}
                                            label={selectedCategory.name} />
                                           
                                        </div>
                                    </>
                                )}
                                {filteredHabits.map((habit) => (
                                <HabitCards
                                    key={habit.id}
                                    habit={habit}
                                    value={dailyCompletions[habit.id]?.value ?? 0}
                                    checked={dailyCompletions[habit.id]?.checked ?? false}
                                    onCompletionChange={(data) => handleCompletionChange(habit.id, data)}
                                />
                            ))}
                            </>
                        )}
                    </>
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