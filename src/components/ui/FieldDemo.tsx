"use client"

import React, { useState, useEffect } from "react"
import type { TrackingType } from "@/src/lib/types/habit"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"

export type NewHabitData = {
  title: string
  tracking_type: TrackingType
  target_value?: number | null
  unit?: string | null
  category_id?: string | null
}

type CategoryOption = { id: string; name: string }

type FieldDemoProps = {
  onSubmit: (data: NewHabitData) => void
  formId?: string
  initialValues?: Partial<NewHabitData>
  categories?: CategoryOption[]
}

const needsGoalAndUnit = (type: TrackingType | "") =>
  type === "numeric" || type === "duration"

const NO_CATEGORY_VALUE = "__none__"

export function FieldDemo({ onSubmit, formId = "new-habit-form", initialValues, categories = [] }: FieldDemoProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "")
  const [trackingType, setTrackingType] = useState<TrackingType | "">(initialValues?.tracking_type ?? "")
  const [dailyGoal, setDailyGoal] = useState(
    initialValues?.target_value != null ? String(initialValues.target_value) : ""
  )
  const [unit, setUnit] = useState(initialValues?.unit ?? "")
  const [categoryId, setCategoryId] = useState<string>(
    initialValues?.category_id && initialValues.category_id !== NO_CATEGORY_VALUE
      ? initialValues.category_id
      : NO_CATEGORY_VALUE
  )

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title ?? "")
      setTrackingType(initialValues.tracking_type ?? "")
      setDailyGoal(initialValues.target_value != null ? String(initialValues.target_value) : "")
      setUnit(initialValues.unit ?? "")
      setCategoryId(initialValues.category_id && initialValues.category_id !== NO_CATEGORY_VALUE ? initialValues.category_id : NO_CATEGORY_VALUE)
    }
  }, [initialValues?.title, initialValues?.tracking_type, initialValues?.target_value, initialValues?.unit, initialValues?.category_id])

  const showGoalAndUnit = needsGoalAndUnit(trackingType)
  const defaultUnit = trackingType === "duration" ? "min" : ""

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const type = (trackingType === "" ? "checkbox" : trackingType) as TrackingType
    if (!title.trim()) return
    if (showGoalAndUnit) {
      const target = Number(dailyGoal)
      if (!Number.isFinite(target) || target < 1) return
      onSubmit({
        title: title.trim(),
        tracking_type: type,
        target_value: target,
        unit: (unit || defaultUnit || undefined) || null,
        category_id: categoryId && categoryId !== NO_CATEGORY_VALUE ? categoryId : null,
      })
    } else {
      onSubmit({
        title: title.trim(),
        tracking_type: type,
        category_id: categoryId && categoryId !== NO_CATEGORY_VALUE ? categoryId : null,
      })
    }
    setTitle("")
    setTrackingType("")
    setDailyGoal("")
    setUnit("")
    setCategoryId(NO_CATEGORY_VALUE)
  }

  return (
    <div className="w-full max-w-full">
      <form id={formId} onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="habit-title">
                  Habit Title
                </FieldLabel>
                <Input
                  id="habit-title"
                  name="title"
                  placeholder="e.g. Drink Water, Read Books"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tracking-type">
                  Tracking Type
                </FieldLabel>
                <Select
                  value={trackingType}
                  onValueChange={(v) => {
                    setTrackingType(v as TrackingType | "")
                    if (v !== "numeric" && v !== "duration") {
                      setDailyGoal("")
                      setUnit("")
                    }
                  }}
                >
                  <SelectTrigger id="tracking-type">
                    <SelectValue placeholder="Select Tracking Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="checkbox">Check box</SelectItem>
                      <SelectItem value="numeric">Numeric Counter</SelectItem>
                      <SelectItem value="duration">Time Duration</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {categories.length > 0 && (
                <Field>
                  <FieldLabel htmlFor="habit-category">
                    Category
                  </FieldLabel>
                  <Select
                    value={categoryId}
                    onValueChange={setCategoryId}
                  >
                    <SelectTrigger id="habit-category">
                      <SelectValue placeholder="No category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY_VALUE}>No category</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {showGoalAndUnit && (
                <>
                  <Field>
                    <FieldLabel htmlFor="daily-goal">
                      Daily Goal
                    </FieldLabel>
                    <Input
                      id="daily-goal"
                      name="dailyGoal"
                      type="number"
                      min={1}
                      placeholder={trackingType === "duration" ? "e.g. 60" : "e.g. 8"}
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="habit-unit">
                      Unit
                    </FieldLabel>
                    <Input
                      id="habit-unit"
                      name="unit"
                      placeholder={
                        trackingType === "duration"
                          ? "e.g. min, hours"
                          : "e.g. cups, pages, reps"
                      }
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </Field>
                </>
              )}
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </div>
  )
}
