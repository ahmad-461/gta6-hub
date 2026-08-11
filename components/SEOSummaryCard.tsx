"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ShieldAlert, Loader2 } from "lucide-react"

export default function SEOSummaryCard() {
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState<number | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/insights")
        if (!res.ok) {
          setUnavailable(true)
          return
        }
        const data = await res.json()
        // If the Python service is unreachable, it degrades gracefully returning is_mock: true.
        // We show a neutral "Insights unavailable" state, not a 0 count.
        if (data && data.success && !data.is_mock && Array.isArray(data.seo)) {
          setCount(data.seo.length)
        } else {
          setUnavailable(true)
        }
      } catch (err) {
        console.error("Failed to fetch SEO insights summary for dashboard:", err)
        setUnavailable(true)
      } finally {
        setLoading(false)
      }
    }
    fetchCount()
  }, [])

  return (
    <Link
      href="/admin/insights"
      className="bg-card-bg border border-card-border p-6 rounded-xl hover:border-foreground/20 transition-all duration-200 group flex items-center justify-between"
    >
      <div>
        <p className="text-sm font-medium text-foreground/60">SEO Flagged Items</p>
        <div className="mt-1">
          {loading ? (
            <div className="flex items-center space-x-2 text-foreground/40">
              <Loader2 className="h-4 w-4 animate-spin text-neon-blue" />
              <span className="text-xs">Checking...</span>
            </div>
          ) : unavailable ? (
            <span className="text-sm font-semibold text-amber-500 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
              Insights unavailable
            </span>
          ) : (
            <p className="text-3xl font-bold text-white group-hover:text-white transition-colors">
              {count} {count === 1 ? "flagged item" : "flagged items"}
            </p>
          )}
        </div>
      </div>
      <div className={`p-3 rounded-lg ${unavailable ? 'bg-amber-500/10 text-amber-500' : 'bg-neon-pink/10 text-neon-pink'}`}>
        <ShieldAlert size={24} />
      </div>
    </Link>
  )
}
