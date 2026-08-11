import React from "react"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  FileText,
  BookOpen,
  Users,
  Key,
  MessageSquare,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  ExternalLink,
  Plus
} from "lucide-react"
import SystemHealth from "@/components/SystemHealth"

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
        color: "text-neon-pink bg-neon-pink/10"
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
        color: "text-neon-blue bg-neon-blue/10"
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
        color: "text-neon-purple bg-neon-purple/10"
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
        color: "text-neon-yellow bg-neon-yellow/10"
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
      color: "text-neon-pink",
      borderColor: "hover:border-neon-pink/40",
      glowColor: "group-hover:shadow-neon-pink/10",
      bg: "bg-neon-pink/10"
    },
    {
      name: "Guides",
      count: guidesCount.count || 0,
      icon: BookOpen,
      href: "/admin/guides",
      color: "text-neon-blue",
      borderColor: "hover:border-neon-blue/40",
      glowColor: "group-hover:shadow-neon-blue/10",
      bg: "bg-neon-blue/10"
    },
    {
      name: "Characters",
      count: charactersCount.count || 0,
      icon: Users,
      href: "/admin/characters",
      color: "text-neon-purple",
      borderColor: "hover:border-neon-purple/40",
      glowColor: "group-hover:shadow-neon-purple/10",
      bg: "bg-neon-purple/10"
    },
    {
      name: "Cheat Codes",
      count: cheatsCount.count || 0,
      icon: Key,
      href: "/admin/cheats",
      color: "text-neon-yellow",
      borderColor: "hover:border-neon-yellow/40",
      glowColor: "group-hover:shadow-neon-yellow/10",
      bg: "bg-neon-yellow/10"
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
    { label: "Articles", count: pulseCounts.articles, percentage: (pulseCounts.articles / maxCount) * 100, color: "bg-neon-pink" },
    { label: "Guides", count: pulseCounts.guides, percentage: (pulseCounts.guides / maxCount) * 100, color: "bg-neon-blue" },
    { label: "Characters", count: pulseCounts.characters, percentage: (pulseCounts.characters / maxCount) * 100, color: "bg-neon-purple" },
    { label: "Cheat Codes", count: pulseCounts.cheats, percentage: (pulseCounts.cheats / maxCount) * 100, color: "bg-neon-yellow" },
  ]

  const isPulseEmpty = pulseCounts.articles === 0 && pulseCounts.guides === 0 && pulseCounts.characters === 0 && pulseCounts.cheats === 0

  // Date Formatting for Server Rendering
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const formattedDate = new Date().toLocaleDateString('en-US', dateOptions)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. COMMAND CENTER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-card-border pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-black tracking-widest text-foreground/45 font-mono uppercase">
            <span>GTA VI HUB</span>
            <span className="h-1 w-1 bg-card-border rounded-full"></span>
            <span>CMS Panel</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest sm:text-3xl mt-1 uppercase font-mono">
            Command Center
          </h1>
          <p className="mt-1 text-xs text-foreground/60 font-medium">
            Welcome back, Administrator. Manage content distribution and real-time operations.
          </p>
        </div>

        {/* Live indicator block */}
        <div className="flex items-center space-x-4 shrink-0 bg-[#121016] border border-card-border p-3 rounded-xl">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono">
              System Online
            </span>
          </div>
          <div className="h-4 w-px bg-card-border"></div>
          <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest font-mono">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* 2. PREMIUM STATS GRID */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className={`group relative bg-[#15131a] border border-card-border p-5 rounded-xl transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-md ${stat.borderColor} ${stat.glowColor} hover:-translate-y-1`}
            >
              {/* Colored top indicator */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${stat.bg} ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`}></div>

              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest font-mono">
                  {stat.name}
                </span>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={16} />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-3xl font-black text-white leading-none tracking-tight font-mono">
                  {stat.count}
                </p>
                <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-1 font-mono">
                  Total Records
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* 3. MIDDLE LAYOUT SECTION (Health, Mission Control, Pulse & Leonida) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (Health & Mission Control) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Mission Control Grid */}
          <div className="bg-[#15131a] border border-card-border rounded-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white tracking-widest uppercase font-mono">
                Mission Control
              </h2>
              <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest font-mono bg-neon-blue/10 px-2 py-0.5 rounded border border-neon-blue/15">
                Quick Actions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shortcut 1: Article */}
              <Link
                href="/admin/articles/new"
                className="flex items-start justify-between p-4 bg-[#0d0c10]/60 border border-card-border rounded-xl hover:border-neon-pink/40 hover:bg-neon-pink/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-neon-pink/10 text-neon-pink border border-neon-pink/20 rounded-lg group-hover:bg-neon-pink/20 transition shrink-0 mt-0.5">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Create Article</p>
                    <p className="text-[11px] text-foreground/45 mt-1 font-medium leading-relaxed">Write and publish an analytical news piece or update.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-foreground/30 group-hover:text-neon-pink group-hover:translate-x-1 transition shrink-0 mt-1" />
              </Link>

              {/* Shortcut 2: Guide */}
              <Link
                href="/admin/guides/new"
                className="flex items-start justify-between p-4 bg-[#0d0c10]/60 border border-card-border rounded-xl hover:border-neon-blue/40 hover:bg-neon-blue/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-lg group-hover:bg-neon-blue/20 transition shrink-0 mt-0.5">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Create Guide</p>
                    <p className="text-[11px] text-foreground/45 mt-1 font-medium leading-relaxed">Publish a strategy walkthrough, walkthrough or secrets map.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-foreground/30 group-hover:text-neon-blue group-hover:translate-x-1 transition shrink-0 mt-1" />
              </Link>

              {/* Shortcut 3: Character */}
              <Link
                href="/admin/characters/new"
                className="flex items-start justify-between p-4 bg-[#0d0c10]/60 border border-card-border rounded-xl hover:border-neon-purple/40 hover:bg-neon-purple/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-neon-purple/10 text-neon-purple border border-neon-purple/20 rounded-lg group-hover:bg-neon-purple/20 transition shrink-0 mt-0.5">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Add Character</p>
                    <p className="text-[11px] text-foreground/45 mt-1 font-medium leading-relaxed">Add biography, lore and voice details for a new cast member.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-foreground/30 group-hover:text-neon-purple group-hover:translate-x-1 transition shrink-0 mt-1" />
              </Link>

              {/* Shortcut 4: Cheats */}
              <Link
                href="/admin/cheats"
                className="flex items-start justify-between p-4 bg-[#0d0c10]/60 border border-card-border rounded-xl hover:border-neon-yellow/40 hover:bg-neon-yellow/5 transition duration-300 group"
              >
                <div className="flex space-x-3.5">
                  <div className="p-2 bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/20 rounded-lg group-hover:bg-neon-yellow/20 transition shrink-0 mt-0.5">
                    <Key size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Manage Cheats</p>
                    <p className="text-[11px] text-foreground/45 mt-1 font-medium leading-relaxed">Bulk import CSV templates or verify secret cheat sequences.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-foreground/30 group-hover:text-neon-yellow group-hover:translate-x-1 transition shrink-0 mt-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (System Health, Content Pulse & Leonida Status) */}
        <div className="xl:col-span-4 space-y-6">
          {/* System Health Section */}
          <SystemHealth />

          {/* Combined Pulse & Easter Egg Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
            {/* Content Pulse Visual Block */}
            <div className="bg-[#15131a] border border-card-border p-6 rounded-xl space-y-4 shadow-xl">
              <div>
                <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest font-mono">
                  Content Pulse
                </h3>
                <p className="text-[10px] text-foreground/50 font-medium mt-0.5">
                  Relative distribution of content types.
                </p>
              </div>

              {isPulseEmpty ? (
                <div className="py-6 text-center border border-dashed border-card-border rounded-lg bg-[#0d0c10]/40">
                  <p className="text-xs text-foreground/40 font-medium">No recorded content found.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {pulseItems.map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-foreground/75 font-mono uppercase text-[10px] tracking-wider">{item.label}</span>
                        <span className="text-white font-mono">{item.count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0d0c10] rounded-full overflow-hidden border border-card-border/40">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leonida Status Card (Subtle signature easter egg) */}
            <div className="bg-[#15131a] border border-card-border p-6 rounded-xl relative overflow-hidden shadow-xl min-h-[170px] flex flex-col justify-between group">
              {/* Very low opacity grid/radar graphics */}
              <div className="absolute inset-0 bg-[radial-gradient(#ff007f08_1.2px,transparent_1.2px)] [background-size:16px_16px] pointer-events-none"></div>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full border border-neon-pink/5 pointer-events-none"></div>
              <div className="absolute -right-16 -bottom-16 w-44 h-44 rounded-full border border-neon-blue/5 pointer-events-none"></div>

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-neon-pink tracking-widest uppercase font-mono">
                    Leonida Status
                  </p>
                  <p className="text-lg font-black text-white font-mono tracking-widest uppercase mt-0.5">
                    Vice City
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#0d0c10] border border-card-border/50 px-2.5 py-1 rounded text-[9px] font-mono font-bold text-foreground/40">
                  <span>GPS: 25.7617 N</span>
                </div>
              </div>

              <div className="space-y-1.5 relative z-10 border-t border-card-border/50 pt-3">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
                    Content System Online
                  </span>
                </div>
                <p className="text-[10px] text-foreground/45 font-mono leading-none tracking-tight">
                  SECTOR: CENTRAL HUB // PORT_CONNECTED: 8080
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM GRID (PENDING MODERATION & ACTIVITY LOG) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Moderation Panel */}
        <div className="bg-[#15131a] border border-card-border rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-card-border/60 pb-3">
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="text-neon-pink shrink-0" size={18} />
                <h2 className="text-sm font-black text-white tracking-widest uppercase font-mono">
                  Pending Moderation
                </h2>
              </div>
              <span className="bg-neon-pink/15 text-neon-pink border border-neon-pink/20 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono">
                {commentsCount.count || 0} Awaiting
              </span>
            </div>

            {pendingComments && pendingComments.length > 0 ? (
              <div className="space-y-4 divide-y divide-card-border/30">
                {pendingComments.map((comment, index) => (
                  <div key={comment.id} className={`pt-4 first:pt-0 space-y-1.5`}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-extrabold text-white font-mono tracking-wide">{comment.name}</p>
                      <span className="text-[10px] text-foreground/40 font-mono">
                        {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground/50 font-medium italic truncate">
                      on &quot;{(comment.articles as any)?.title || "Unknown Article"}&quot;
                    </p>
                    <p className="text-xs text-foreground/80 leading-relaxed bg-[#0d0c10]/60 p-3 rounded-lg border border-card-border/40 font-medium">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-card-border rounded-xl bg-[#0d0c10]/30 flex flex-col items-center justify-center space-y-2">
                <ShieldCheck size={28} className="text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">✓ All clear</p>
                  <p className="text-[11px] text-foreground/40 font-medium mt-0.5">No pending comments requiring action.</p>
                </div>
              </div>
            )}
          </div>

          {pendingComments && pendingComments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-card-border/50">
              <Link
                href="/admin/comments"
                className="flex items-center justify-center text-xs font-black uppercase tracking-widest text-neon-pink hover:text-neon-pink/80 transition duration-150"
              >
                Go to Moderation Queue <ArrowRight size={14} className="ml-1.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Activity Log / Recently Updated Panel */}
        <div className="bg-[#15131a] border border-card-border rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-card-border/60 pb-3">
              <div className="flex items-center space-x-2.5">
                <Clock className="text-neon-blue shrink-0" size={18} />
                <h2 className="text-sm font-black text-white tracking-widest uppercase font-mono">
                  Activity Log
                </h2>
              </div>
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest font-mono">
                Live Feed
              </span>
            </div>

            {recentUpdatesToShow.length > 0 ? (
              <div className="space-y-4">
                {recentUpdatesToShow.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between bg-[#0d0c10]/40 p-3 border border-card-border/30 rounded-xl hover:border-card-border/60 transition duration-150 group">
                    <div className="min-w-0 flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 font-mono ${item.color}`}>
                        {item.type}
                      </span>
                      <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-neon-blue transition-colors">
                        {item.title}
                      </p>
                    </div>
                    <div className="text-right flex items-center space-x-3 shrink-0 ml-4">
                      <span className="text-[10px] text-foreground/40 font-mono">
                        {item.updatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {item.href && (
                        <Link
                          href={item.href}
                          className="text-[10px] font-bold text-neon-blue uppercase tracking-widest hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-card-border rounded-xl bg-[#0d0c10]/30 flex flex-col items-center justify-center space-y-2">
                <Clock size={28} className="text-foreground/30" />
                <div>
                  <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider font-mono">No Recent Activity</p>
                  <p className="text-[11px] text-foreground/40 font-medium mt-0.5">Your latest content updates will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
