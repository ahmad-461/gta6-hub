"use client"

import React, { useEffect } from "react"
import Script from "next/script"

interface AdSenseInitializerProps {
  publisherId: string | null
}

export default function AdSenseInitializer({ publisherId }: AdSenseInitializerProps) {
  useEffect(() => {
    if (!publisherId) return

    const initAds = () => {
      try {
        const ads = document.querySelectorAll(".adsbygoogle")
        ads.forEach((ad) => {
          // Only push if it hasn't been initialized
          if (!ad.getAttribute("data-adsbygoogle-status")) {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            } catch (e) {
              // Suppress individual ad load errors
            }
          }
        })
      } catch (err) {
        console.error("AdSense dynamic init error:", err)
      }
    }

    // Run after a short delay to ensure elements are in the DOM
    const timer = setTimeout(initAds, 250)
    return () => clearTimeout(timer)
  }, [publisherId])

  if (!publisherId) return null

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
