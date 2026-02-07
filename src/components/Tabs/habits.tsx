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
} from "lucide-react"
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
import { cn } from "@/src/lib/utils"
import Loader from "../loader"

const TRACKING_LABELS: Record<string, string> = {
  checkbox: "Checkbox",
  numeric: "Numeric",
  duration: "Duration",
}

type ViewMode = "active" | "archived" | "category"

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
    setHabits(list.sort((a, b) => (a.archived ? 1 : 0) - (b.archived ? 1 : 0)))
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
    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      title: formData.title,
      tracking_type: formData.tracking_type,
      ...(formData.target_value != null && { target_value: formData.target_value }),
      ...(formData.unit != null && formData.unit !== "" && { unit: formData.unit }),
      ...(formData.category_id && { category_id: formData.category_id }),
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
                    <Card>
                      <CardContent className="py-3 px-4 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat.habitCount} habit{cat.habitCount !== 1 ? "s" : ""}
                          </p>
                        </div>
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
          <ul className="space-y-2">
            {displayHabits.map((habit) => (
              <li key={habit.id}>
                <Card className={cn(habit.archived && "opacity-75")}>
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-2">
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
                        <DropdownMenuItem onClick={() => openEditHabit(habit)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {habit.archived ? (
                          <DropdownMenuItem onClick={() => handleUnarchive(habit)}>
                            <ArchiveRestore className="h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleArchive(habit)}>
                            <Archive className="h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(habit)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
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
