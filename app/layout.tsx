import React from "react"
import type { Metadata } from "next"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ChatWidget from "@/components/ChatWidget"
import RadioWidget from "@/components/RadioWidget"
import PageBanner from "@/components/PageBanner"
import ConsoleModeManager from "@/components/ConsoleModeManager"
import "@/app/globals.css"
import { Toaster } from "sonner"
import { Anton, Space_Mono } from "next/font/google"

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
})

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "GTA 6 Hub - Ultimate Intelligence, Cheats & Community News",
    template: "%s | GTA 6 Hub",
  },
  description: "The ultimate resource for Grand Theft Auto VI. Find dynamic cheat codes, comprehensive character bios, news, and custom modding tools.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gta6-hub-liard.vercel.app"),
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
    <html lang="en" className={`${anton.variable} ${spaceMono.variable}`}>
      <body className="flex flex-col min-h-screen bg-[#0B0710] text-[#F5F0FA] antialiased selection:bg-[#FF2E88] selection:text-white font-sans">
        {!isAdminRoute && <Header />}
        <main className="flex-grow flex flex-col">
          {!isAdminRoute && pathname !== "/" && pathname !== "" && <PageBanner pathname={pathname} />}
          {children}
        </main>
        {!isAdminRoute && <Footer />}
        {!isAdminRoute && <ChatWidget />}
        {!isAdminRoute && <RadioWidget />}
        {!isAdminRoute && <ConsoleModeManager />}
        <Toaster
          theme="dark"
          richColors
          closeButton
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "bg-[#150C1F] border border-[rgba(245,240,250,0.14)] text-[#F5F0FA] font-mono",
              success: "text-[#00E5FF]",
              error: "text-red-500",
              info: "text-[#FF2E88]",
              warning: "text-amber-500",
            }
          }}
        />
      </body>
    </html>
  )
}
