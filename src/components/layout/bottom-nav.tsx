"use client";

import { CalendarDays, Activity, ChartNoAxesColumn, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { useTab } from "@/src/contexts/tab-context";

const NAV_ITEMS = [
    { id: "today", label: "Today", icon: CalendarDays },
    { id: "habits", label: "Habits", icon: Activity },
    { id: "analytics", label: "Analytics", icon: ChartNoAxesColumn },
    { id: "settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
    const { activeTab, setActiveTab } = useTab();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center  sm:hidden">
            <nav className="relative flex h-22 pb-5 w-full max-w-md items-center justify-around border border-t-gray-50 bg-gray-50 px-2 shadow-none ">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className="relative flex h-full flex-1  flex-col items-center justify-center gap-1 transition-colors"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active-border"
                                    className="absolute top-0 h-[3px] rounded-full w-12 bg-zinc-950 dark:bg-white"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div
                                className={cn(
                                    "relative flex h-8 w-8 items-center justify-center transition-all duration-300",
                                    isActive ? "text-zinc-950 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                                )}
                            >
                                <Icon className="relative z-10 h-5 w-5" />
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] -mt-1 font-medium transition-colors duration-300",
                                    isActive ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-zinc-500"
                                )}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
