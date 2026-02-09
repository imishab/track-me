"use client";

import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { BottomNavWrapper } from "@/src/components/layout/BottomNavWrapper";
import { SplashScreen } from "@/src/components/SplashScreen";
import { TabProvider } from "@/src/contexts/tab-context";
import { ThemeProvider } from "../components/ui/theme-provider";

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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>TrackMe</title>
        <meta name="description" content="Track your habits and analytics instantly" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      {/* PushAlert unified code - load before </head> */}
      <Script
        src="https://cdn.pushalert.co/unified_0279a5dc690001526219e4712e97c85d.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined") {
            const w = window as unknown as { pushalertbyiw?: Array<unknown> }
            w.pushalertbyiw = w.pushalertbyiw ?? []
            w.pushalertbyiw.push([
              "onSuccess",
              (result: { subscriber_id?: string }) => {
                if (result?.subscriber_id) {
                  fetch("/api/push/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subscriber_id: result.subscriber_id }),
                    credentials: "include",
                  }).catch(() => {})
                }
              },
            ])
          }
        }}
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
