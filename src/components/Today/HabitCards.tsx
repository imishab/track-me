"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Minus, Plus, Trophy, Check, Flame } from 'lucide-react'
import type { Habit } from '@/src/lib/types/habit'

const playSound = (path: string) => {
  try {
    const audio = new Audio(path)
    audio.volume = 0.5
    audio.play().catch(() => {})
  } catch {
    // ignore
  }
}

type HabitCardsProps = {
  habit: Habit
}

export default function HabitCards({ habit }: HabitCardsProps) {
  const target = habit.target_value ?? 8
  const unit = habit.unit ?? (habit.tracking_type === 'duration' ? 'min' : '')
  const [value, setValue] = useState(0)
  const [checked, setChecked] = useState(false)
  const [trophyBlink, setTrophyBlink] = useState(false)

  const isCompleted =
    habit.tracking_type === 'checkbox' ? checked : value >= target

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

  const handleMinus = useCallback(() => {
    playSound('/sounds/add.mp3')
    setValue((v) => Math.max(0, v - 1))
  }, [])

  const handlePlus = useCallback(() => {
    const wasBelowTarget = value < target
    playSound('/sounds/minus.mp3')
    setValue((v) => {
      const next = habit.tracking_type === 'numeric' ? v + 1 : Math.min(target, v + 1)
      if (wasBelowTarget && next >= target) {
        playSound('/sounds/success.mp3')
        setTrophyBlink(true)
      }
      return next
    })
  }, [habit.tracking_type, target, value])

  const handleCheckbox = useCallback(() => {
    setChecked((c) => {
      const next = !c
      if (next) {
        playSound('/sounds/success.mp3')
        setTrophyBlink(true)
      }
      return next
    })
  }, [])

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
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-white text-xl">{habit.title}</p>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-200/90 dark:bg-orange-600/80 px-2 py-0.5 text-white text-xs font-medium">
                <Flame className="h-3.5 w-3.5 text-orange-500 dark:text-orange-300" />
                <span>1</span>
              </span>
            )}
          </div>
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
            <motion.div
              animate={
                trophyBlink
                  ? {
                      scale: [1, 1.35, 1.15, 1.35, 1],
                      opacity: [1, 0.9, 1, 0.9, 1],
                    }
                  : {}
              }
              transition={{
                duration: 0.8,
                times: [0, 0.25, 0.5, 0.75, 1],
                onComplete: () => setTrophyBlink(false),
              }}
            >
              <Button
                size="icon"
                className={`h-10 w-10 rounded-lg border-0 text-white ${
                  isCompleted ? 'bg-violet-500 shadow-lg shadow-violet-500/50 hover:bg-violet-600' : 'bg-[#2D2F3B] hover:bg-[#2D2F3B]/80 opacity-50'
                }`}
                onClick={handleCheckbox}
              >
                <Check className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-lg text-white border-0 bg-[#2D2F3B] hover:bg-[#2D2F3B]/80"
                onClick={handleMinus}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <motion.div
                animate={
                  trophyBlink
                    ? {
                        scale: [1, 1.35, 1.15, 1.35, 1],
                        opacity: [1, 0.9, 1, 0.9, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 0.8,
                  times: [0, 0.25, 0.5, 0.75, 1],
                  onComplete: () => setTrophyBlink(false),
                }}
              >
                <Button
                  variant="secondary"
                  size="icon"
                  className={`h-10 w-10 rounded-lg text-white border-0 ${
                    isCompleted ? 'bg-green-500 shadow-lg shadow-green-500/50 hover:bg-green-600' : 'bg-[#2D2F3B] hover:bg-[#2D2F3B]/80 opacity-50'
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                </Button>
              </motion.div>
              <Button
                size="icon"
                className="h-10 w-10 rounded-lg bg-violet-500 hover:bg-violet-600 text-white border-0"
                onClick={handlePlus}
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
