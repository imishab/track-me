"use client";

import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { BottomNavWrapper } from "@/src/components/layout/BottomNavWrapper";
import { SplashScreen } from "@/src/components/SplashScreen";
import { TabProvider } from "@/src/contexts/tab-context";
import { ThemeProvider } from "../components/ui/theme-provider";
import { useEffect } from "react";
import { initOneSignal } from "../lib/onesignal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    initOneSignal();
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>TrackMe</title>
        <meta name="description" content="Track your habits and analytics instantly" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <TabProvider>
          <SplashScreen>
            <div className="pb-24 sm:pb-0">
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </div>
            <BottomNavWrapper />
          </SplashScreen>
        </TabProvider>
      </body>
    </html>
  );
}
