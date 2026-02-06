"use client";

import React, { createContext, useContext, useState } from "react";

type TabValue = "today" | "habits" | "analytics" | "settings";

interface TabContextType {
    activeTab: TabValue;
    setActiveTab: (tab: TabValue) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState<TabValue>("today");

    return (
        <TabContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </TabContext.Provider>
    );
}

export function useTab() {
    const context = useContext(TabContext);
    if (context === undefined) {
        throw new Error("useTab must be used within a TabProvider");
    }
    return context;
}
