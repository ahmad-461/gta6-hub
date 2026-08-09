import React from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import "@/app/globals.css"

export const metadata: Metadata = {
  title: {
    default: "GTA 6 Hub - Ultimate Guides, Cheats & Community News",
    template: "%s | GTA 6 Hub",
  },
  description: "The ultimate resource for Grand Theft Auto VI. Find dynamic cheat codes, comprehensive character guides, news, and custom modding tools.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub.vercel.app"),
  openGraph: {
    title: "GTA 6 Hub",
    description: "The ultimate Grand Theft Auto VI portal.",
    url: "/",
    siteName: "GTA 6 Hub",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GTA 6 Hub Portal Preview",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "GTA 6 Hub",
    description: "The ultimate Grand Theft Auto VI portal.",
    images: ["/og-image.jpg"],
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const pathname = headersList.get("x-pathname") || ""
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api")

  let isMaintenanceMode = false
  try {
    const supabase = createSupabaseServerClient()
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single()
    if (data && data.value === "true") {
      isMaintenanceMode = true
    }
  } catch (e) {
    // Graceful fallback if database is not set up
  }

  if (isMaintenanceMode && !isAdminRoute) {
    return (
      <html lang="en">
        <body className="flex flex-col min-h-screen bg-background text-foreground antialiased justify-center items-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="inline-flex p-4 rounded-full bg-neon-pink/10 border border-neon-pink text-neon-pink animate-pulse">
              <span className="text-4xl">🛠️</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
              GTA VI HUB
            </h1>
            <p className="text-lg text-foreground/80">
              Site under maintenance, check back soon.
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-neon-pink to-neon-blue mx-auto rounded-full" />
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-neon-pink selection:text-white">
        <Header />
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
