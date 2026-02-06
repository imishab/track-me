"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { useTab } from "@/src/contexts/tab-context";
import Today from "../components/Tabs/today";
import Analytics from "../components/Tabs/analytics";
import Habits from "../components/Tabs/habits";
import Settings from "../components/Tabs/settings";

export default function Home() {
  const { activeTab, setActiveTab } = useTab();

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
      <TabsList className="hidden">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="habits">Habits</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="today" className="mt-0 flex-1 px-1 mt-4">
        <Today />
      </TabsContent>

      <TabsContent value="habits" className="mt-0 flex-1 p-6">
        <Habits />
      </TabsContent>

      <TabsContent value="analytics" className="mt-0 flex-1 p-6">
        <Analytics />
      </TabsContent>

      <TabsContent value="settings" className="mt-0 flex-1 p-6">
        <Settings />
      </TabsContent>
    </Tabs>
  );
}
