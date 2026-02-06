"use client"

import React, { useState, useEffect, useCallback } from 'react'
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

export default function Today() {
    const [open, setOpen] = useState(false)
    const [habits, setHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)

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
            setHabits(data ?? [])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchHabits()
    }, [fetchHabits])

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
                            <p className="text-md font-semibold text-violet-400">Friday</p>
                            <p className="text-xl font-bold ">{new Date().toDateString()}</p>
                        </div>
                        <div className='flex flex-col items-center '>
                            <h1 className='text-xl font-black text-violet-400'>20%</h1>
                            <p className='text-xs  text-gray-500'>Completed</p>
                        </div>
                    </div>
                    <Progress value={53} className='mt-4 mb-5' />
                </div>
            </Header>

            <div className="flex-1 overflow-y-auto space-y-4 max-w-md mx-auto pt-28 pb-24 px-4">
                {loading ? (
                    <p className="text-muted-foreground text-sm">Loading habits…</p>
                ) : habits.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No habits yet. Tap + New Habit to add one.</p>
                ) : (
                    habits.map((habit) => <HabitCards key={habit.id} habit={habit} />)
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