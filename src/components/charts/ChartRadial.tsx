"use client"

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  ChartContainer,
  type ChartConfig,
} from "@/src/components/ui/chart"

const chartConfig = {
  progress: {
    label: "Completed",
    color: "hsl(262, 83%, 58%)",
  },
} satisfies ChartConfig

type CategoryRadialChartProps = {
  /** Number of habits completed (e.g. checked or reached target). */
  completed: number
  /** Total habits in the category. */
  total: number
  /** Category name (e.g. "Prayer"). */
  label?: string
}

export function CategoryRadialChart({
  completed,
  total,
  label = "habits",
}: CategoryRadialChartProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const chartData = [
    {
      progress: percent,
      fill: "var(--color-progress)",
    },
  ]

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-base">
          {label !== "habits" ? label : "Category"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={-270}
            innerRadius={70}
            outerRadius={95}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[76, 64]}
            />
            <RadialBar
              dataKey="progress"
              background
              cornerRadius={10}
              max={100}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {completed}/{total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                          className="fill-muted-foreground text-sm"
                        >
                          {label !== "habits" ? `${label} done` : "completed"}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
