"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  FileText,
  BookOpen,
  Users,
  Key,
  MessageSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  Loader2
} from "lucide-react"
import SystemHealth from "@/components/SystemHealth"
import SEOSummaryCard from "@/components/SEOSummaryCard"
import Sparkline from "@/components/ui/Sparkline"

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingComments, setPendingComments] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [activityTrends, setActivityTrends] = useState<Record<string, number[]>>({
    article: [0, 0, 0, 0, 0, 0, 0],
    character: [0, 0, 0, 0, 0, 0, 0],
    cheat_code: [0, 0, 0, 0, 0, 0, 0]
  })
  const [trendDiffs, setTrendDiffs] = useState<Record<string, number>>({
    article: 0,
    character: 0,
    cheat_code: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch counts
      const [
        articlesCount,
        charactersCount,
        cheatsCount,
        commentsCount
      ] = await Promise.all([
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("characters").select("*", { count: "exact", head: true }),
        supabase.from("cheat_codes").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("status", "pending")
      ])

      setPendingCount(commentsCount.count || 0)

      // 2. Fetch pending comments
      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, name, content, created_at, article_id, articles(title)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5)

      setPendingComments(commentsData || [])

      // 3. Fetch activity log feed (last 10)
      const { data: activitiesData } = await supabase
        .from("activity_log")
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          entity_title,
          created_at,
          actor_id,
          profiles (name)
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      const safeActivities = (activitiesData || []).map((act) => ({
        id: act.id,
        action: act.action,
        entityType: act.entity_type,
        entityId: act.entity_id,
        entityTitle: act.entity_title || `${act.entity_type} ${act.action}`,
        createdAt: new Date(act.created_at),
        actorName: (act.profiles as any)?.name || "System"
      }))
      setRecentActivities(safeActivities)

      // 4. Compute 7-day activity sparkline data
      // We will count activity_log occurrences for each content type over the last 7 days (including today)
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toDateString()
      })

      // Fetch all activity_logs for content types in the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: logsData } = await supabase
        .from("activity_log")
        .select("entity_type, created_at")
        .gte("created_at", sevenDaysAgo.toISOString())

      const counts: Record<string, number[]> = {
        article: [0, 0, 0, 0, 0, 0, 0],
        character: [0, 0, 0, 0, 0, 0, 0],
        cheat_code: [0, 0, 0, 0, 0, 0, 0]
      }

      const diffs: Record<string, number> = {
        article: 0,
        character: 0,
        cheat_code: 0
      }

      if (logsData) {
        logsData.forEach((log) => {
          const type = log.entity_type
          if (counts[type]) {
            const logDate = new Date(log.created_at).toDateString()
            const dayIndex = days.indexOf(logDate)
            if (dayIndex !== -1) {
              counts[type][dayIndex] += 1
            }
          }
        })

        // Compute "this week" change diff
        Object.keys(counts).forEach((key) => {
          diffs[key] = counts[key].reduce((sum, val) => sum + val, 0)
        })
      }

      setActivityTrends(counts)
      setTrendDiffs(diffs)

      setStats([
        {
          name: "Articles",
          count: articlesCount.count || 0,
          trend: counts.article,
          diff: diffs.article,
          icon: FileText,
          href: "/admin/articles",
          color: "#FF2E88",
          borderColor: "hover:border-[#FF2E88]/40",
          bg: "bg-[#FF2E88]/10",
          entityKey: "article"
        },
        {
          name: "Characters",
          count: charactersCount.count || 0,
          trend: counts.character,
          diff: diffs.character,
          icon: Users,
          href: "/admin/characters",
          color: "#FF8A3D",
          borderColor: "hover:border-[#FF8A3D]/40",
          bg: "bg-[#FF8A3D]/10",
          entityKey: "character"
        },
        {
          name: "Cheat Codes",
          count: cheatsCount.count || 0,
          trend: counts.cheat_code,
          diff: diffs.cheat_code,
          icon: Key,
          href: "/admin/cheats",
          color: "#A78BFA",
          borderColor: "hover:border-[#A78BFA]/40",
          bg: "bg-[#A78BFA]/10",
          entityKey: "cheat_code"
        },
      ])

    } catch (err) {
      console.error("Dashboard loaded error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-mono">
        <Loader2 className="animate-spin text-[#00E5FF] h-8 w-8" />
      </div>
    )
  }

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-8 animate-fade-in font-mono">
      {/* 1. COMMAND CENTER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[rgba(245,240,250,0.14)] pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-black tracking-widest text-[#9C8FAE] uppercase">
            <span>GTA VI HUB</span>
            <span className="h-1 w-1 bg-[rgba(245,240,250,0.14)] rounded-full"></span>
            <span>CMS Panel</span>
          </div>
          <h1 className="text-2xl font-normal text-white tracking-widest sm:text-3xl mt-1 uppercase font-anton">
            Command Center
          </h1>
          <p className="mt-1 text-xs text-[#9C8FAE] font-normal">
            Welcome back, Administrator. Manage content distribution and real-time operations.
          </p>
        </div>

        {/* Live indicator block */}
        <div className="flex items-center space-x-4 shrink-0 bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-3 rounded">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              System Online
            </span>
          </div>
          <div className="h-4 w-px bg-[rgba(245,240,250,0.14)]"></div>
          <p className="text-[10px] font-bold text-[#9C8FAE]/50 uppercase tracking-widest">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* 2. PREMIUM STATS GRID WITH SPARKLINE TRENDS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isPositive = stat.diff > 0
          return (
            <Link
              key={stat.name}
              href={stat.href}
              prefetch={false}
              className={`group relative bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-5 rounded transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-md ${stat.borderColor} hover:-translate-y-1`}
            >
              {/* Colored top indicator */}
              <div
                className={`absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-100 transition-opacity`}
                style={{ backgroundColor: stat.color }}
              ></div>

              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-[#9C8FAE] uppercase tracking-widest">
                  {stat.name}
                </span>
                <div
                  className={`p-2 rounded ${stat.bg} transition-transform duration-300 group-hover:scale-105`}
                  style={{ color: stat.color }}
                >
                  <Icon size={16} />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold text-white leading-none tracking-tight font-space-mono">
                    {stat.count}
                  </p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isPositive ? "text-emerald-400" : "text-[#9C8FAE]/40"}`}>
                    {isPositive ? `+${stat.diff} acts` : "static"}
                  </span>
                </div>
                <p className="text-[10px] text-[#9C8FAE]/40 font-bold uppercase tracking-wider mt-1 mb-2">
                  Total Records
                </p>

                {/* 7-Day Sparkline Render */}
                <Sparkline data={stat.trend} color={stat.color} />
              </div>
            </Link>
          )
        })}
        <SEOSummaryCard />
      </div>

      {/* 3. MIDDLE LAYOUT SECTION (Health, Mission Control, Pulse & Leonida) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (Health & Mission Control) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Mission Control Grid */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                Mission Control
              </h2>
              <span className="text-[10px] font-bold text-[#00E5FF] uppercase tracking-widest bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/15">
                Quick Actions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shortcut 1: Article */}
              <Link
                href="/admin/articles/new"
                prefetch={false}
                className="flex items-start justify-between p-4 bg-[#0B0710]/60 border border-[rgba(245,240,250,0.14)] rounded hover:border-[#FF2E88]/40 hover:bg-[#FF2E88]/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-[#FF2E88]/10 text-[#FF2E88] border border-[#FF2E88]/20 rounded group-hover:bg-[#FF2E88]/20 transition shrink-0 mt-0.5">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Create Article</p>
                    <p className="text-[11px] text-[#9C8FAE] mt-1 font-medium leading-relaxed">Write and publish an analytical news piece or update.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#9C8FAE]/30 group-hover:text-[#FF2E88] group-hover:translate-x-1 transition shrink-0 mt-1" />
              </Link>


              {/* Shortcut 3: Character */}
              <Link
                href="/admin/characters/new"
                prefetch={false}
                className="flex items-start justify-between p-4 bg-[#0B0710]/60 border border-[rgba(245,240,250,0.14)] rounded hover:border-[#FF8A3D]/40 hover:bg-[#FF8A3D]/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-[#FF8A3D]/10 text-[#FF8A3D] border border-[#FF8A3D]/20 rounded group-hover:bg-[#FF8A3D]/20 transition shrink-0 mt-0.5">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Add Character</p>
                    <p className="text-[11px] text-[#9C8FAE] mt-1 font-medium leading-relaxed">Populate the Wiki with biographical info, voice actors, and stats.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#9C8FAE]/30 group-hover:text-[#FF8A3D] group-hover:translate-x-1 transition shrink-0 mt-1" />
              </Link>

              {/* Shortcut 4: Cheats */}
              <Link
                href="/admin/cheats"
                prefetch={false}
                className="flex items-start justify-between p-4 bg-[#0B0710]/60 border border-[rgba(245,240,250,0.14)] rounded hover:border-[#A78BFA]/40 hover:bg-[#A78BFA]/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20 rounded group-hover:bg-[#A78BFA]/20 transition shrink-0 mt-0.5">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Manage Cheats</p>
                    <p className="text-[11px] text-[#9C8FAE] mt-1 font-medium leading-relaxed">Add codes, platforms, CSV batch uploads, or modify visibility.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#9C8FAE]/30 group-hover:text-[#A78BFA] group-hover:translate-x-1 transition shrink-0 mt-1" />
              </Link>
            </div>
          </div>

          {/* System Health Component */}
          <SystemHealth />
        </div>

        {/* Right Column (Content Pulse & Leonida status easter egg) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Content Pulse Panel */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                Content Pulse
              </h2>
              <span className="text-[10px] font-bold text-[#9C8FAE] uppercase tracking-widest">
                Proportion
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                { label: "Articles", count: stats[0]?.count || 0, color: "bg-[#FF2E88]" },
                { label: "Characters", count: stats[1]?.count || 0, color: "bg-[#FF8A3D]" },
                { label: "Cheat Codes", count: stats[2]?.count || 0, color: "bg-[#A78BFA]" },
              ].map((item) => {
                const max = Math.max(stats[0]?.count || 1, stats[1]?.count || 1, stats[2]?.count || 1)
                const percentage = (item.count / max) * 100
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-[#9C8FAE] uppercase text-[10px] tracking-wider">{item.label}</span>
                      <span className="text-white font-space-mono text-xs">{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0B0710] rounded overflow-hidden border border-[rgba(245,240,250,0.08)]">
                      <div
                        className={`h-full ${item.color} rounded transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Leonida Status Card */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded relative overflow-hidden shadow-xl min-h-[170px] flex flex-col justify-between group">
            <div className="absolute inset-0 bg-[radial-gradient(#ff007f08_1.2px,transparent_1.2px)] [background-size:16px_16px] pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-bold text-[#FF2E88] tracking-widest uppercase">
                  Leonida Status
                </p>
                <p className="text-lg font-bold text-white font-anton tracking-widest uppercase mt-0.5">
                  Vice City
                </p>
              </div>
              <div className="flex items-center space-x-1.5 bg-[#0B0710] border border-[rgba(245,240,250,0.14)] px-2.5 py-1 rounded text-[9px] font-bold text-[#9C8FAE]/40">
                <span>GPS: 25.7617 N</span>
              </div>
            </div>

            <div className="space-y-1.5 relative z-10 border-t border-[rgba(245,240,250,0.14)] pt-3">
              <div className="flex items-center space-x-2 text-xs">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
                  Content System Online
                </span>
              </div>
              <p className="text-[10px] text-[#9C8FAE]/45 leading-none tracking-tight">
                SECTOR: CENTRAL HUB // PORT_CONNECTED: 8080
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM GRID (PENDING MODERATION & ACTIVITY LOG) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Moderation Panel */}
        <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-[rgba(245,240,250,0.14)] pb-3">
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="text-[#FF2E88] shrink-0" size={18} />
                <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                  Pending Moderation
                </h2>
              </div>
              <span className="bg-[#FF2E88]/15 text-[#FF2E88] border border-[#FF2E88]/20 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                {pendingCount} Awaiting
              </span>
            </div>

            {pendingComments.length > 0 ? (
              <div className="space-y-4 divide-y divide-[rgba(245,240,250,0.14)]">
                {pendingComments.map((comment) => (
                  <div key={comment.id} className="pt-4 first:pt-0 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-white tracking-wide">{comment.name}</p>
                      <span className="text-[10px] text-[#9C8FAE]/40">
                        {new Date(comment.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9C8FAE]/50 italic truncate">
                      on &quot;{(comment.articles as any)?.title || "Unknown Article"}&quot;
                    </p>
                    <p className="text-xs text-[#9C8FAE] leading-relaxed bg-[#0B0710]/60 p-3 rounded border border-[rgba(245,240,250,0.08)] font-medium">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-[rgba(245,240,250,0.14)] rounded bg-[#0B0710]/30 flex flex-col items-center justify-center space-y-2">
                <ShieldCheck size={28} className="text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">✓ All clear</p>
                  <p className="text-[11px] text-[#9C8FAE]/40 font-medium mt-0.5">No pending comments requiring action.</p>
                </div>
              </div>
            )}
          </div>

          {pendingComments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[rgba(245,240,250,0.14)]">
              <Link
                href="/admin/comments"
                prefetch={false}
                className="flex items-center justify-center text-xs font-bold uppercase tracking-widest text-[#FF2E88] hover:text-[#FF2E88]/80 transition duration-150"
              >
                Go to Moderation Queue <ArrowRight size={14} className="ml-1.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Activity Log / Recently Updated Panel */}
        <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-[rgba(245,240,250,0.14)] pb-3">
              <div className="flex items-center space-x-2.5">
                <Clock className="text-[#00E5FF] shrink-0" size={18} />
                <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                  Activity Log
                </h2>
              </div>
              <span className="text-[10px] font-bold text-[#9C8FAE] uppercase tracking-widest">
                Live Feed
              </span>
            </div>

            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((item, idx) => {
                  let badgeColor = "text-[#FF2E88] bg-[#FF2E88]/10 border border-[#FF2E88]/15"
                  if (item.entityType === "guide") {
                    badgeColor = "text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/15"
                  } else if (item.entityType === "character") {
                    badgeColor = "text-[#FF8A3D] bg-[#FF8A3D]/10 border border-[#FF8A3D]/15"
                  } else if (item.entityType === "cheat_code") {
                    badgeColor = "text-[#A78BFA] bg-[#A78BFA]/10 border border-[#A78BFA]/15"
                  }

                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between bg-[#0B0710]/40 p-3 border border-[rgba(245,240,250,0.08)] rounded hover:border-[rgba(245,240,250,0.14)] transition duration-150 group"
                    >
                      <div className="min-w-0 flex items-center space-x-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${badgeColor}`}>
                          {item.entityType.replace("_", " ")}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white truncate leading-tight transition-colors">
                            {item.entityTitle}
                          </p>
                          <p className="text-[9px] text-[#9C8FAE]/50 mt-0.5 uppercase tracking-wider font-mono">
                            By {item.actorName} &bull; {item.action}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-3 shrink-0 ml-4 font-space-mono text-xs">
                        <span className="text-[10px] text-[#9C8FAE]/40">
                          {item.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-[rgba(245,240,250,0.14)] rounded bg-[#0B0710]/30 flex flex-col items-center justify-center space-y-2">
                <Clock size={28} className="text-[#9C8FAE]/30" />
                <div>
                  <p className="text-xs font-bold text-[#9C8FAE]/50 uppercase tracking-wider">No Recent Activity</p>
                  <p className="text-[11px] text-[#9C8FAE]/40 font-medium mt-0.5">Your latest content updates will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
