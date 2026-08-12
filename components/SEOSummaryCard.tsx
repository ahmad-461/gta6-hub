"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ShieldAlert, Loader2, AlertTriangle } from "lucide-react"

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
      prefetch={false}
      className="group relative bg-[#15131a] border border-card-border p-5 rounded-xl transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-md hover:border-amber-500/40 group-hover:shadow-amber-500/10 hover:-translate-y-1 min-h-[140px]"
    >
      {/* Colored top indicator */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-amber-500/20 text-amber-500 opacity-40 group-hover:opacity-100 transition-opacity`}></div>

      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest font-mono">
          SEO Audit
        </span>
        <div className={`p-2 rounded-lg bg-amber-500/10 text-amber-500 transition-transform duration-300 group-hover:scale-110`}>
          <ShieldAlert size={16} />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center space-x-2 text-foreground/40 font-mono">
            <Loader2 className="h-4 w-4 animate-spin text-neon-blue shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Checking...</span>
          </div>
        ) : unavailable ? (
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider font-mono flex items-center gap-1.5 leading-none">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 animate-pulse" />
            OFFLINE
          </span>
        ) : (
          <p className="text-3xl font-black text-white leading-none tracking-tight font-mono">
            {count}
          </p>
        )}
        <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-1 font-mono">
          {unavailable ? "Insights Offline" : count === 1 ? "Flagged Item" : "Flagged Items"}
        </p>
      </div>
    </Link>
  )
}
