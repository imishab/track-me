"use client"

import React, { useState } from 'react'
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
import { FieldDemo } from '../ui/FieldDemo'
import { ScrollArea } from '../ui/scroll-area'

export default function Today() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Header height='h-24'>
                <div className='flex flex-col w-full'>
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

            <div className="flex-1 overflow-y-auto space-y-4 pt-28 pb-24 px-4">
                <HabitCards />
                <HabitCards />
                <HabitCards />
                <HabitCards />
                <HabitCards />
            </div>

            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Button
                        className="fixed bottom-28 right-4 z-40 h-12 rounded-full bg-violet-500 px-6 shadow-lg hover:bg-violet-600"
                        size="lg"
                    >
                        <Plus className="h-5 w-5" />
                        New Habit
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>New Habit</DrawerTitle>
                        <DrawerDescription>
                            Add a new habit to track daily.
                        </DrawerDescription>
                    </DrawerHeader>
                    <ScrollArea className="h-[54vh]">

                    <div className="px-4">
                        <FieldDemo />
                    </div>
                    </ScrollArea>
                    <DrawerFooter className='mb-4 flex justify-between'>
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                        <Button className="bg-violet-500 text-white hover:bg-violet-600">
                            Add Habit
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    )
}