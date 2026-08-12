import React from "react"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  FileText,
  BookOpen,
  Users,
  Key,
  MessageSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus
} from "lucide-react"
import SystemHealth from "@/components/SystemHealth"
import SEOSummaryCard from "@/components/SEOSummaryCard"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const supabase = createSupabaseServerClient()

  // 1. Fetch counts
  const [
    articlesCount,
    guidesCount,
    charactersCount,
    cheatsCount,
    commentsCount
  ] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("guides").select("*", { count: "exact", head: true }),
    supabase.from("characters").select("*", { count: "exact", head: true }),
    supabase.from("cheat_codes").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("status", "pending")
  ])

  // 2. Fetch pending comments
  const { data: pendingComments } = await supabase
    .from("comments")
    .select("id, name, content, created_at, article_id, articles(title)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  // 3. Fetch recently updated content
  const [
    recentArticles,
    recentGuides,
    recentCharacters,
    recentCheats
  ] = await Promise.all([
    supabase.from("articles").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(3),
    supabase.from("guides").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(3),
    supabase.from("characters").select("id, name, updated_at").order("updated_at", { ascending: false }).limit(3),
    supabase.from("cheat_codes").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(3),
  ])

  // Format and merge recently updated content
  const recentlyUpdated: any[] = []

  if (recentArticles.data) {
    recentArticles.data.forEach((item) => {
      recentlyUpdated.push({
        id: item.id,
        title: item.title,
        type: "Article",
        href: `/admin/articles/${item.id}`,
        updatedAt: new Date(item.updated_at),
        color: "text-[#FF2E88] bg-[#FF2E88]/10 border border-[#FF2E88]/15"
      })
    })
  }
  if (recentGuides.data) {
    recentGuides.data.forEach((item) => {
      recentlyUpdated.push({
        id: item.id,
        title: item.title,
        type: "Guide",
        href: `/admin/guides/${item.id}`,
        updatedAt: new Date(item.updated_at),
        color: "text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/15"
      })
    })
  }
  if (recentCharacters.data) {
    recentCharacters.data.forEach((item) => {
      recentlyUpdated.push({
        id: item.id,
        title: item.name,
        type: "Character",
        href: `/admin/characters/${item.id}`,
        updatedAt: new Date(item.updated_at),
        color: "text-[#6C1FB5] bg-[#6C1FB5]/10 border border-[#6C1FB5]/15"
      })
    })
  }
  if (recentCheats.data) {
    recentCheats.data.forEach((item) => {
      recentlyUpdated.push({
        id: item.id,
        title: `${item.title}`,
        type: "Cheat Code",
        href: `/admin/cheats`,
        updatedAt: new Date(item.updated_at),
        color: "text-amber-400 bg-amber-400/10 border border-amber-400/15"
      })
    })
  }

  // Sort by updatedAt descending
  recentlyUpdated.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  const recentUpdatesToShow = recentlyUpdated.slice(0, 5)

  const stats = [
    {
      name: "Articles",
      count: articlesCount.count || 0,
      icon: FileText,
      href: "/admin/articles",
      color: "text-[#FF2E88]",
      borderColor: "hover:border-[#FF2E88]/40",
      bg: "bg-[#FF2E88]/10"
    },
    {
      name: "Guides",
      count: guidesCount.count || 0,
      icon: BookOpen,
      href: "/admin/guides",
      color: "text-[#00E5FF]",
      borderColor: "hover:border-[#00E5FF]/40",
      bg: "bg-[#00E5FF]/10"
    },
    {
      name: "Characters",
      count: charactersCount.count || 0,
      icon: Users,
      href: "/admin/characters",
      color: "text-[#6C1FB5]",
      borderColor: "hover:border-[#6C1FB5]/40",
      bg: "bg-[#6C1FB5]/10"
    },
    {
      name: "Cheat Codes",
      count: cheatsCount.count || 0,
      icon: Key,
      href: "/admin/cheats",
      color: "text-amber-400",
      borderColor: "hover:border-amber-400/40",
      bg: "bg-amber-400/10"
    },
  ]

  // Content Pulse math
  const pulseCounts = {
    articles: articlesCount.count || 0,
    guides: guidesCount.count || 0,
    characters: charactersCount.count || 0,
    cheats: cheatsCount.count || 0,
  }

  const maxCount = Math.max(
    pulseCounts.articles,
    pulseCounts.guides,
    pulseCounts.characters,
    pulseCounts.cheats,
    1
  )

  const pulseItems = [
    { label: "Articles", count: pulseCounts.articles, percentage: (pulseCounts.articles / maxCount) * 100, color: "bg-[#FF2E88]" },
    { label: "Guides", count: pulseCounts.guides, percentage: (pulseCounts.guides / maxCount) * 100, color: "bg-[#00E5FF]" },
    { label: "Characters", count: pulseCounts.characters, percentage: (pulseCounts.characters / maxCount) * 100, color: "bg-[#6C1FB5]" },
    { label: "Cheat Codes", count: pulseCounts.cheats, percentage: (pulseCounts.cheats / maxCount) * 100, color: "bg-amber-400" },
  ]

  const isPulseEmpty = pulseCounts.articles === 0 && pulseCounts.guides === 0 && pulseCounts.characters === 0 && pulseCounts.cheats === 0

  // Date Formatting for Server Rendering
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const formattedDate = new Date().toLocaleDateString('en-US', dateOptions)

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

      {/* 2. PREMIUM STATS GRID */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              href={stat.href}
              prefetch={false}
              className={`group relative bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-5 rounded transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-md ${stat.borderColor} hover:-translate-y-1`}
            >
              {/* Colored top indicator */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${stat.bg} ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`}></div>

              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-[#9C8FAE] uppercase tracking-widest">
                  {stat.name}
                </span>
                <div className={`p-2 rounded ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-105`}>
                  <Icon size={16} />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-3xl font-bold text-white leading-none tracking-tight font-space-mono">
                  {stat.count}
                </p>
                <p className="text-[10px] text-[#9C8FAE]/40 font-bold uppercase tracking-wider mt-1">
                  Total Records
                </p>
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

              {/* Shortcut 2: Guide */}
              <Link
                href="/admin/guides/new"
                prefetch={false}
                className="flex items-start justify-between p-4 bg-[#0B0710]/60 border border-[rgba(245,240,250,0.14)] rounded hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 rounded group-hover:bg-[#00E5FF]/20 transition shrink-0 mt-0.5">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Create Guide</p>
                    <p className="text-[11px] text-[#9C8FAE] mt-1 font-medium leading-relaxed">Publish interactive game guides, mission steps, or map insights.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#9C8FAE]/30 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition shrink-0 mt-1" />
              </Link>

              {/* Shortcut 3: Character */}
              <Link
                href="/admin/characters/new"
                prefetch={false}
                className="flex items-start justify-between p-4 bg-[#0B0710]/60 border border-[rgba(245,240,250,0.14)] rounded hover:border-[#6C1FB5]/40 hover:bg-[#6C1FB5]/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-[#6C1FB5]/10 text-[#6C1FB5] border border-[#6C1FB5]/20 rounded group-hover:bg-[#6C1FB5]/20 transition shrink-0 mt-0.5">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Add Character</p>
                    <p className="text-[11px] text-[#9C8FAE] mt-1 font-medium leading-relaxed">Populate the Wiki with biographical info, voice actors, and stats.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#9C8FAE]/30 group-hover:text-[#6C1FB5] group-hover:translate-x-1 transition shrink-0 mt-1" />
              </Link>

              {/* Shortcut 4: Cheats */}
              <Link
                href="/admin/cheats"
                prefetch={false}
                className="flex items-start justify-between p-4 bg-[#0B0710]/60 border border-[rgba(245,240,250,0.14)] rounded hover:border-amber-400/40 hover:bg-amber-400/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded group-hover:bg-amber-400/20 transition shrink-0 mt-0.5">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Manage Cheats</p>
                    <p className="text-[11px] text-[#9C8FAE] mt-1 font-medium leading-relaxed">Add codes, platforms, CSV batch uploads, or modify visibility.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[#9C8FAE]/30 group-hover:text-amber-400 group-hover:translate-x-1 transition shrink-0 mt-1" />
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

            {isPulseEmpty ? (
              <div className="text-center py-8 border border-dashed border-[rgba(245,240,250,0.14)] rounded bg-[#0B0710]/40">
                <p className="text-xs text-[#9C8FAE] font-medium">No recorded content found.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {pulseItems.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-[#9C8FAE] uppercase text-[10px] tracking-wider">{item.label}</span>
                      <span className="text-white font-space-mono text-xs">{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0B0710] rounded overflow-hidden border border-[rgba(245,240,250,0.08)]">
                      <div
                        className={`h-full ${item.color} rounded transition-all duration-1000 ease-out`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leonida Status Card (Subtle signature easter egg) */}
          <div className="bg-[#150C1F] border border-[rgba(245,240,250,0.14)] p-6 rounded relative overflow-hidden shadow-xl min-h-[170px] flex flex-col justify-between group">
            {/* Very low opacity grid/radar graphics */}
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
                {commentsCount.count || 0} Awaiting
              </span>
            </div>

            {pendingComments && pendingComments.length > 0 ? (
              <div className="space-y-4 divide-y divide-[rgba(245,240,250,0.14)]">
                {pendingComments.map((comment) => (
                  <div key={comment.id} className="pt-4 first:pt-0 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-white tracking-wide">{comment.name}</p>
                      <span className="text-[10px] text-[#9C8FAE]/40">
                        {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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

          {pendingComments && pendingComments.length > 0 && (
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

            {recentUpdatesToShow.length > 0 ? (
              <div className="space-y-4">
                {recentUpdatesToShow.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between bg-[#0B0710]/40 p-3 border border-[rgba(245,240,250,0.08)] rounded hover:border-[rgba(245,240,250,0.14)] transition duration-150 group">
                    <div className="min-w-0 flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${item.color}`}>
                        {item.type}
                      </span>
                      <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#00E5FF] transition-colors">
                        {item.title}
                      </p>
                    </div>
                    <div className="text-right flex items-center space-x-3 shrink-0 ml-4 font-space-mono text-xs">
                      <span className="text-[10px] text-[#9C8FAE]/40">
                        {item.updatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {item.href && (
                        <Link
                          href={item.href}
                          prefetch={false}
                          className="text-[10px] font-bold text-[#00E5FF] uppercase tracking-widest hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
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
