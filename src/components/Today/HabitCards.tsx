"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Minus, Plus, Trophy, Check } from 'lucide-react'
import type { Habit } from '@/src/lib/types/habit'

type HabitCardsProps = {
  habit: Habit
}

export default function HabitCards({ habit }: HabitCardsProps) {
  const target = habit.target_value ?? 8
  const unit = habit.unit ?? (habit.tracking_type === 'duration' ? 'min' : '')
  const [value, setValue] = useState(0)
  const [checked, setChecked] = useState(false)

  const progress =
    habit.tracking_type === 'checkbox'
      ? (checked ? 100 : 0)
      : habit.tracking_type === 'duration'
        ? Math.min(100, (value / (target || 1)) * 100)
        : Math.min(100, (value / (target || 1)) * 100)

  const subtitle =
    habit.tracking_type === 'checkbox'
      ? (checked ? 'Done' : 'Not done')
      : habit.tracking_type === 'duration'
        ? `${value} / ${target} min`
        : `${value} / ${target}${unit ? ` ${unit}` : ''}`

  return (
    <Card className="relative border-0 bg-[#1A1B26] shadow-none rounded-xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2D2F3B] rounded-t-xl">
        <motion.div
          className="h-full bg-violet-500 rounded-t-xl origin-left"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      <CardContent className="p-4 flex items-center justify-between gap-4 pt-5">
        <div className="flex flex-col min-w-0 space-y-1">
          <p className="font-bold text-white text-xl">{habit.title}</p>
          <p className="text-md">
            {habit.tracking_type === 'checkbox' ? (
              <span className={checked ? 'text-green-400' : 'text-gray-400'}>{subtitle}</span>
            ) : (
              <>
                {value} <span className="text-gray-400">/ {target}{unit ? ` ${unit}` : ''}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center bg-[#2D2F3B] rounded-xl p-1.5 gap-2 shrink-0">
          {habit.tracking_type === 'checkbox' ? (
            <Button
              size="icon"
              className={`h-10 w-10 rounded-lg border-0 ${checked ? 'bg-violet-500 hover:bg-violet-600' : 'bg-[#2D2F3B] hover:bg-[#2D2F3B]/80'} text-white`}
              onClick={() => setChecked((c) => !c)}
            >
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-lg text-white border-0 bg-[#2D2F3B] hover:bg-[#2D2F3B]/80"
                onClick={() => setValue((v) => Math.max(0, v - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-lg bg-[#2D2F3B] hover:bg-[#2D2F3B]/80 text-white border-0"
              >
                <Trophy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-10 w-10 rounded-lg bg-violet-500 hover:bg-violet-600 text-white border-0"
                onClick={() => setValue((v) => Math.min(target, v + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
