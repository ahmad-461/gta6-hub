import React from "react"
import type { Metadata } from "next"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ChatWidget from "@/components/ChatWidget"
import "@/app/globals.css"
import { Toaster } from "sonner"

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

import { headers } from "next/headers"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = headers().get("x-pathname") || ""
  const isAdminRoute = pathname.startsWith("/admin")

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-neon-pink selection:text-white">
        {!isAdminRoute && <Header />}
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        {!isAdminRoute && <Footer />}
        {!isAdminRoute && <ChatWidget />}
        <Toaster theme="dark" richColors closeButton position="top-right" />
      </body>
    </html>
  )
}
