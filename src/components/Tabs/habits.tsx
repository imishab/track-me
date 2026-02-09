"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Plus,
  MoreVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  FolderPlus,
  GripVertical,
  ChevronLeft,
  ListTodo,
  BarChart3,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Header from "../layout/Header"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { FieldDemo, type NewHabitData } from "../ui/FieldDemo"
import { ScrollArea } from "../ui/scroll-area"
import { supabase } from "@/src/lib/supabase/client"
import type { Habit, Category } from "@/src/lib/types/habit"
import { getTodayKey } from "@/src/lib/date-utils"
import { cn } from "@/src/lib/utils"
import Loader from "../loader"
import HabitCards from "../Today/HabitCards"
import { CategoryAnalytics } from "./CategoryAnalytics"

const TRACKING_LABELS: Record<string, string> = {
  checkbox: "Checkbox",
  numeric: "Numeric",
  duration: "Duration",
}

const STORAGE_KEY_PREFIX = "track-me-daily"
type DayCompletion = { value: number; checked: boolean }

function loadDailyCompletionsFromStorage(): Record<string, DayCompletion> {
  if (typeof window === "undefined") return {}
  try {
    const key = getTodayKey()
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}-${key}`)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

type ViewMode = "active" | "archived" | "category"
type CategoryDetailTab = "todo" | "analytics"
type CategoryDetail = { id: string; name: string; habits: Habit[] }

function SortableHabitRow({
  habit,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  habit: Habit
  onEdit: (h: Habit) => void
  onArchive: (h: Habit) => void
  onUnarchive: (h: Habit) => void
  onDelete: (h: Habit) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <li ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50 z-10")}>
      <Card className={cn(habit.archived && "opacity-75")}>
        <CardContent className="py-3 px-4 flex items-center gap-2">
          <button
            type="button"
            className="touch-none cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted -ml-1"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{habit.title}</p>
            <p className="text-xs text-muted-foreground">
              {TRACKING_LABELS[habit.tracking_type] ?? habit.tracking_type}
              {habit.target_value != null && ` · ${habit.target_value} ${habit.unit ?? ""}`}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(habit)}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {habit.archived ? (
                <DropdownMenuItem onClick={() => onUnarchive(habit)}>
                  <ArchiveRestore className="h-4 w-4" />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onArchive(habit)}>
                  <Archive className="h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(habit)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </li>
  )
}

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("active")
  const [habitDrawerOpen, setHabitDrawerOpen] = useState(false)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryDetail | null>(null)
  const [categoryDetailTab, setCategoryDetailTab] = useState<CategoryDetailTab>("todo")
  const [categoryTodoCompletions, setCategoryTodoCompletions] = useState<Record<string, DayCompletion>>(
    loadDailyCompletionsFromStorage
  )
  const [categoryTodoDateKey] = useState(() => getTodayKey())

  const fetchHabits = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setHabits([])
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    const list = data ?? []
    list.sort(
      (a, b) =>
        (a.archived ? 1 : 0) - (b.archived ? 1 : 0) ||
        (a.order_index ?? 999) - (b.order_index ?? 999) ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    setHabits(list)
    setLoading(false)
    if (error) setHabits([])
  }, [])

  const fetchCategories = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setCategories([])
      return
    }
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name")
    setCategories(error ? [] : (data ?? []))
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchHabits(), fetchCategories()])
    }
    load()
  }, [fetchHabits, fetchCategories])

  useEffect(() => {
    if (selectedCategoryDetail) {
      setCategoryTodoCompletions(loadDailyCompletionsFromStorage())
    }
  }, [selectedCategoryDetail])

  useEffect(() => {
    if (!selectedCategoryDetail) return
    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}-${categoryTodoDateKey}`,
        JSON.stringify(categoryTodoCompletions)
      )
    } catch {
      // ignore
    }
  }, [categoryTodoDateKey, categoryTodoCompletions, selectedCategoryDetail])

  useEffect(() => {
    if (!selectedCategoryDetail || selectedCategoryDetail.habits.length === 0) return
    const sync = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const isCompleted = (h: Habit, data: DayCompletion | undefined) => {
        if (!data) return false
        if (h.tracking_type === "checkbox") return data.checked
        const target = h.target_value ?? 8
        return data.value >= target
      }
      try {
        for (const habit of selectedCategoryDetail.habits) {
          const data = categoryTodoCompletions[habit.id]
          const value = data?.value ?? 0
          const completed = isCompleted(habit, data)
          await supabase.from("habit_completions").upsert(
            {
              user_id: user.id,
              habit_id: habit.id,
              date: categoryTodoDateKey,
              value,
              completed,
            },
            { onConflict: "habit_id,date" }
          )
        }
      } catch {
        // table may not exist
      }
    }
    sync()
  }, [selectedCategoryDetail, categoryTodoCompletions, categoryTodoDateKey])

  const activeHabits = habits.filter((h) => !h.archived)
  const archivedHabits = habits.filter((h) => h.archived)
  const habitsByCategory = categories.map((c) => ({
    ...c,
    habits: activeHabits.filter((h) => h.category_id === c.id),
    habitCount: activeHabits.filter((h) => h.category_id === c.id).length,
  }))
  const uncategorizedCount = activeHabits.filter((h) => !h.category_id).length

  const handleAddHabit = async (formData: NewHabitData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const nextOrder =
      habits.length > 0
        ? Math.max(...habits.map((h) => h.order_index ?? 0)) + 1
        : 0
    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      title: formData.title,
      tracking_type: formData.tracking_type,
      ...(formData.target_value != null && { target_value: formData.target_value }),
      ...(formData.unit != null && formData.unit !== "" && { unit: formData.unit }),
      ...(formData.category_id && { category_id: formData.category_id }),
      order_index: nextOrder,
    })
    if (error) return
    setHabitDrawerOpen(false)
    await fetchHabits()
  }

  const handleEditHabit = async (formData: NewHabitData) => {
    if (!editingHabit) return
    const { error } = await supabase
      .from("habits")
      .update({
        title: formData.title,
        tracking_type: formData.tracking_type,
        target_value: formData.target_value ?? null,
        unit: formData.unit ?? null,
        category_id: formData.category_id ?? null,
      })
      .eq("id", editingHabit.id)
    if (error) return
    setHabitDrawerOpen(false)
    setEditingHabit(null)
    await fetchHabits()
  }

  const handleArchive = async (habit: Habit) => {
    await supabase.from("habits").update({ archived: true }).eq("id", habit.id)
    await fetchHabits()
  }

  const handleUnarchive = async (habit: Habit) => {
    await supabase.from("habits").update({ archived: false }).eq("id", habit.id)
    await fetchHabits()
  }

  const handleDelete = async (habit: Habit) => {
    await supabase.from("habits").delete().eq("id", habit.id)
    setDeleteTarget(null)
    await fetchHabits()
  }

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from("categories").insert({
      user_id: user.id,
      name: categoryName.trim(),
    })
    if (error) return
    setCategoryDrawerOpen(false)
    setCategoryName("")
    setEditingCategory(null)
    await fetchCategories()
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !categoryName.trim()) return
    const { error } = await supabase
      .from("categories")
      .update({ name: categoryName.trim() })
      .eq("id", editingCategory.id)
    if (error) return
    setCategoryDrawerOpen(false)
    setCategoryName("")
    setEditingCategory(null)
    await fetchCategories()
  }

  const handleDeleteCategory = async (category: Category) => {
    await supabase.from("habits").update({ category_id: null }).eq("category_id", category.id)
    await supabase.from("categories").delete().eq("id", category.id)
    setDeleteCategoryTarget(null)
    await fetchHabits()
    await fetchCategories()
  }

  const openEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    setHabitDrawerOpen(true)
  }

  const openAddHabit = () => {
    setEditingHabit(null)
    setHabitDrawerOpen(true)
  }

  const openAddCategory = () => {
    setEditingCategory(null)
    setCategoryName("")
    setCategoryDrawerOpen(true)
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryDrawerOpen(true)
  }

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }))

  const displayHabits =
    viewMode === "active" ? activeHabits : viewMode === "archived" ? archivedHabits : []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const list = viewMode === "active" ? activeHabits : archivedHabits
      const oldIndex = list.findIndex((h) => h.id === active.id)
      const newIndex = list.findIndex((h) => h.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered =
        viewMode === "active"
          ? arrayMove(activeHabits, oldIndex, newIndex)
          : arrayMove(archivedHabits, oldIndex, newIndex)
      const other =
        viewMode === "active" ? archivedHabits : activeHabits
      const withNewOrder: Habit[] =
        viewMode === "active"
          ? [
              ...reordered.map((h, i) => ({ ...h, order_index: i })),
              ...other.map((h, i) => ({ ...h, order_index: reordered.length + i })),
            ]
          : [
              ...other.map((h, i) => ({ ...h, order_index: i })),
              ...reordered.map((h, i) => ({ ...h, order_index: other.length + i })),
            ]
      setHabits(withNewOrder)
      for (const h of withNewOrder) {
        await supabase.from("habits").update({ order_index: h.order_index ?? 0 }).eq("id", h.id)
      }
    },
    [viewMode, activeHabits, archivedHabits]
  )

  return (
    <>
      <Header>
        <p className="text-lg font-semibold">Habits</p>
      </Header>

      <div className="pt-20 pb-24 px-4 max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              variant={viewMode === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("active")}
            >
              Active
            </Button>
            <Button
              variant={viewMode === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("archived")}
            >
              Archived
            </Button>
            <Button
              variant={viewMode === "category" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("category")}
            >
              Category
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openAddHabit}>
                <Plus className="h-4 w-4" />
                Add habit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openAddCategory}>
                <FolderPlus className="h-4 w-4" />
                Add Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {loading ? (
          <Loader />
        ) : selectedCategoryDetail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  setSelectedCategoryDetail(null)
                  setCategoryDetailTab("todo")
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <p className="text-lg font-semibold truncate">{selectedCategoryDetail.name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={categoryDetailTab === "todo" ? "default" : "outline"}
                size="sm"
                className={categoryDetailTab === "todo" ? "bg-violet-500 hover:bg-violet-600" : ""}
                onClick={() => setCategoryDetailTab("todo")}
              >
                <ListTodo className="h-4 w-4 mr-1.5" />
                Todo
              </Button>
              <Button
                variant={categoryDetailTab === "analytics" ? "default" : "outline"}
                size="sm"
                className={categoryDetailTab === "analytics" ? "bg-violet-500 hover:bg-violet-600" : ""}
                onClick={() => setCategoryDetailTab("analytics")}
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Analytics
              </Button>
            </div>
            {categoryDetailTab === "todo" ? (
              selectedCategoryDetail.habits.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No habits in this category.
                  </CardContent>
                </Card>
              ) : (
                <ul className="space-y-2">
                  {selectedCategoryDetail.habits.map((habit) => (
                    <li key={habit.id}>
                      <HabitCards
                        habit={habit}
                        value={categoryTodoCompletions[habit.id]?.value ?? 0}
                        checked={categoryTodoCompletions[habit.id]?.checked ?? false}
                        onCompletionChange={(data) =>
                          setCategoryTodoCompletions((prev) => ({
                            ...prev,
                            [habit.id]: data,
                          }))
                        }
                      />
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <CategoryAnalytics
                categoryName={selectedCategoryDetail.name}
                habits={selectedCategoryDetail.habits}
              />
            )}
          </div>
        ) : viewMode === "category" ? (
          <div className="space-y-4">
            {uncategorizedCount > 0 && (
              <Card>
                <CardContent className="py-3 px-4">
                  <p className="font-medium">Uncategorized</p>
                  <p className="text-xs text-muted-foreground">{uncategorizedCount} habits</p>
                </CardContent>
              </Card>
            )}
            {habitsByCategory.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No categories yet. Add one from the menu.
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-2">
                {habitsByCategory.map((cat) => (
                  <li key={cat.id}>
                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        setSelectedCategoryDetail({
                          id: cat.id,
                          name: cat.name,
                          habits: cat.habits,
                        })
                      }
                    >
                      <CardContent className="py-3 px-4 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat.habitCount} habit{cat.habitCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditCategory(cat)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteCategoryTarget(cat)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : displayHabits.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              {viewMode === "archived"
                ? "No archived habits."
                : "No habits yet. Add one from the menu."}
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayHabits.map((h) => h.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {displayHabits.map((habit) => (
                  <SortableHabitRow
                    key={habit.id}
                    habit={habit}
                    onEdit={openEditHabit}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Habit add/edit drawer */}
      <Drawer open={habitDrawerOpen} onOpenChange={setHabitDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingHabit ? "Edit habit" : "Create new habit"}</DrawerTitle>
            <DrawerDescription>
              {editingHabit ? "Update the habit details below." : "Add a new habit to track daily."}
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="px-4">
              <FieldDemo
                formId="habits-habit-form"
                categories={categoryOptions}
                initialValues={
                  editingHabit
                    ? {
                        title: editingHabit.title,
                        tracking_type: editingHabit.tracking_type,
                        target_value: editingHabit.target_value ?? undefined,
                        unit: editingHabit.unit ?? undefined,
                        category_id: editingHabit.category_id ?? undefined,
                      }
                    : undefined
                }
                onSubmit={editingHabit ? handleEditHabit : handleAddHabit}
              />
            </div>
          </ScrollArea>
          <DrawerFooter className="flex-row justify-end gap-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button type="submit" form="habits-habit-form" className="bg-violet-500 hover:bg-violet-600">
              {editingHabit ? "Save" : "Add habit"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Category add/edit drawer */}
      <Drawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingCategory ? "Edit category" : "Add category"}</DrawerTitle>
            <DrawerDescription>
              {editingCategory
                ? "Update the category name."
                : "Create a category to organize your habits."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                placeholder="e.g. Health, Work, Personal"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DrawerFooter className="flex-row justify-end gap-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button
              onClick={editingCategory ? handleEditCategory : handleAddCategory}
              disabled={!categoryName.trim()}
              className="bg-violet-500 hover:bg-violet-600"
            >
              {editingCategory ? "Save" : "Add category"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete habit dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete category dialog */}
      <AlertDialog
        open={!!deleteCategoryTarget}
        onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteCategoryTarget?.name}&quot;? Habits in this category
              will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteCategoryTarget && handleDeleteCategory(deleteCategoryTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
