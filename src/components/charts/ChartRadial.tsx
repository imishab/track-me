"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card"

type CategoryRadialChartProps = {
  completed: number
  total: number
  label?: string
}

const SIZE = 200
const STROKE_WIDTH = 12
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CENTER = SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CategoryRadialChart({
  completed,
  total,
  label = "habits",
}: CategoryRadialChartProps) {
  const percent = total > 0 ? Math.min(100, (completed / total) * 100) : 0
  const offset = CIRCUMFERENCE * (1 - percent / 100)

  return (
    <Card className="flex flex-col ">
      <CardHeader className="items-center pb-4">
        <CardTitle className="text-base">
          {label !== "habits" ? label : "Category"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="mx-auto aspect-square max-h-[100px] w-full max-w-[100px] relative">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="overflow-visible -rotate-90"
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              className="text-muted/30"
            />
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="hsl(262, 83%, 58%)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-foreground">
              {completed}/{total}
            </span>
            {/* <span className="text-xs text-muted-foreground mt-1">
              {label !== "habits" ? `${label} done` : "completed"}
            </span> */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
