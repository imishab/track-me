import React from 'react'
import { Minus, Plus, Trophy } from 'lucide-react'
import Header from '../layout/Header'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Progress } from '../ui/progress'
import HabitCards from '../Today/HabitCards'

export default function Today() {
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

            <div className="flex-1 overflow-y-auto space-y-4 pt-24 pb-24 ">
               <HabitCards />
               <HabitCards />
               <HabitCards />   
               <HabitCards />
               <HabitCards />
            </div>
        </>
    )
}