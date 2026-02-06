"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Minus, Plus, Trophy } from 'lucide-react'

const MAX_CUPS = 8

export default function HabitCards() {
  const [cups, setCups] = useState(0)
  const progress = (cups / MAX_CUPS) * 100

  return (
    <Card className="relative border-0 bg-[#1A1B26] shadow-none rounded-xl overflow-hidden">
      {/* Progress bar on card border (top edge) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1A1B26] rounded-t-xl">
        <motion.div
          className="h-full bg-violet-500 rounded-t-xl origin-left"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      <CardContent className="p-4 flex items-center justify-between gap-4 pt-5">
        <div className="flex flex-col min-w-0 space-y-1">
          <p className="font-bold text-white text-xl">Drink Water</p>
          <p className="text-md">
            {cups} <span className="text-gray-400">/ {MAX_CUPS} cups</span>
          </p>
        </div>
        <div className="flex items-center bg-[#2D2F3B] rounded-xl p-1.5 gap-2 shrink-0">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-lg text-white border-0"
            onClick={() => setCups((c) => Math.max(0, c - 1))}
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
            onClick={() => setCups((c) => Math.min(MAX_CUPS, c + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
