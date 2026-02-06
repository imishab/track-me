"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Plus, MoreVertical, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react"
import Header from "../layout/Header"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
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
import type { Habit } from "@/src/lib/types/habit"
import { cn } from "@/src/lib/utils"
import Loader from "../loader"

const TRACKING_LABELS: Record<string, string> = {
  checkbox: "Checkbox",
  numeric: "Numeric",
  duration: "Duration",
}

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null)
  const [showArchived, setShowArchived] = useState(false)

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

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const activeHabits = habits.filter((h) => !h.archived)
  const archivedHabits = habits.filter((h) => h.archived)

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
    })
    if (error) return
    setDrawerOpen(false)
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
      })
      .eq("id", editingHabit.id)
    if (error) return
    setDrawerOpen(false)
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

  const openEditDrawer = (habit: Habit) => {
    setEditingHabit(habit)
    setDrawerOpen(true)
  }

  const openAddDrawer = () => {
    setEditingHabit(null)
    setDrawerOpen(true)
  }

  const displayHabits = showArchived ? archivedHabits : activeHabits

  return (
    <>
      <Header>
        <p className="text-lg font-semibold">Habits</p>
      </Header>

      <div className="pt-20 pb-24 px-4 max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "outline" : "default"}
            size="sm"
            onClick={() => setShowArchived(false)}
          >
            Active
          </Button>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(true)}
          >
            Archived
          </Button>
          </div>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button size="sm" className="bg-violet-500 text-white hover:bg-violet-600" onClick={openAddDrawer}>
                <Plus className="h-4 w-4" />
                Add habit
              </Button>
            </DrawerTrigger>
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
                    initialValues={
                      editingHabit
                        ? {
                            title: editingHabit.title,
                            tracking_type: editingHabit.tracking_type,
                            target_value: editingHabit.target_value ?? undefined,
                            unit: editingHabit.unit ?? undefined,
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
        </div>

        {loading ? (
        <Loader />
        ) : displayHabits.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              {showArchived ? "No archived habits." : "No habits yet. Add one to get started."}
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
                        <DropdownMenuItem onClick={() => openEditDrawer(habit)}>
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
    </>
  )
}
