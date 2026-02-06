"use client";

import React from "react";
import { Home, Activity, Scan, BarChart3, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

const NAV_ITEMS = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "activity", label: "Activity", icon: Activity, path: "/activity" },
    { id: "scan", label: "Scan", icon: Scan, path: "/scan", isCenter: true },
    { id: "analytics", label: "Stats", icon: BarChart3, path: "/analytics" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

export function BottomNav() {
    const [activeTab, setActiveTab] = React.useState("home");

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center  sm:hidden">
            <nav className="relative flex h-16 w-full max-w-md items-center justify-around border border-t-gray-50 bg-gray-50 px-2 shadow-none ">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;


                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className="relative flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                            <div
                                className={cn(
                                    "relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300",
                                    isActive ? "text-zinc-950 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-active-pill"
                                        className="absolute inset-0 rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <Icon className="relative z-10 h-5 w-5" />
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-colors duration-300",
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
