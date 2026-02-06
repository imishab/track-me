"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNavbar";

const HIDE_NAV_PATHS = ["/login", "/signup"];

export function BottomNavWrapper() {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_PATHS.some((path) => pathname?.startsWith(path));

  if (hideNav) return null;
  return <BottomNav />;
}
