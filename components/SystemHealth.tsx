"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ShieldCheck, Loader2, Database, LineChart, ShieldAlert } from "lucide-react"

export default function SystemHealth() {
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
    <div className="bg-[#15131a] border border-card-border p-6 rounded-xl space-y-4 shadow-xl relative overflow-hidden group">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      <div className="flex items-center justify-between relative z-10">
        <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest font-mono">
          System Health
        </h3>
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-neon-blue/75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-blue"></span>
        </span>
      </div>

      <div className="space-y-3.5 relative z-10">
        {/* Row 1: SEO Insights */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0c10]/50 border border-card-border/30 hover:border-card-border/70 transition-colors">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="h-4 w-4 text-neon-pink shrink-0" />
            <span className="text-xs font-semibold text-white tracking-wide">SEO Insights</span>
          </div>
          <div>
            {loading ? (
              <div className="flex items-center space-x-1.5 text-foreground/40">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-blue" />
                <span className="text-[11px] font-mono">Auditing...</span>
              </div>
            ) : unavailable ? (
              <Link
                href="/admin/insights"
                prefetch={false}
                className="inline-flex items-center space-x-1 text-xs font-bold text-amber-500 hover:underline bg-amber-500/10 px-2.5 py-1 rounded"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Unavailable</span>
              </Link>
            ) : (
              <Link
                href="/admin/insights"
                prefetch={false}
                className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded ${
                  count && count > 0
                    ? "text-neon-pink bg-neon-pink/10 hover:underline"
                    : "text-emerald-500 bg-emerald-500/10"
                }`}
              >
                {count && count > 0 ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{count} Flags</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>0 Flagged</span>
                  </>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Row 2: Analytics Link */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0c10]/50 border border-card-border/30 hover:border-card-border/70 transition-colors">
          <div className="flex items-center space-x-2.5">
            <LineChart className="h-4 w-4 text-neon-blue shrink-0" />
            <span className="text-xs font-semibold text-white tracking-wide">Analytics Engine</span>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest font-mono">Connected</span>
          </div>
        </div>

        {/* Row 3: Database */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0c10]/50 border border-card-border/30 hover:border-card-border/70 transition-colors">
          <div className="flex items-center space-x-2.5">
            <Database className="h-4 w-4 text-neon-purple shrink-0" />
            <span className="text-xs font-semibold text-white tracking-wide">Relational Database</span>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest font-mono">Healthy</span>
          </div>
        </div>
      </div>
    </div>
  )
}
