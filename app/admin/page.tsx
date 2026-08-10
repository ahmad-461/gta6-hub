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
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"
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
      })
    })
  }
  if (recentCheats.data) {
    recentCheats.data.forEach((item) => {
      recentlyUpdated.push({
        id: item.id,
        title: `${item.title}`,
        type: "Cheat Code",
        href: `/admin/cheats`, // Cheats managed in tabular view
        updatedAt: new Date(item.updated_at),
      })
    })
  }

  // Sort by updatedAt descending
  recentlyUpdated.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  const recentUpdatesToShow = recentlyUpdated.slice(0, 5)

  const stats = [
    { name: "Articles", count: articlesCount.count || 0, icon: FileText, href: "/admin/articles", color: "text-neon-pink", bg: "bg-neon-pink/10" },
    { name: "Guides", count: guidesCount.count || 0, icon: BookOpen, href: "/admin/guides", color: "text-neon-blue", bg: "bg-neon-blue/10" },
    { name: "Characters", count: charactersCount.count || 0, icon: Users, href: "/admin/characters", color: "text-neon-purple", bg: "bg-neon-purple/10" },
    { name: "Cheat Codes", count: cheatsCount.count || 0, icon: Key, href: "/admin/cheats", color: "text-neon-yellow", bg: "bg-neon-yellow/10" },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Get a bird&apos;s-eye view of your content pipeline and moderation tasks.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-card-bg border border-card-border p-6 rounded-xl hover:border-foreground/20 transition-all duration-200 group flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground/60">{stat.name}</p>
                <p className="text-3xl font-bold text-white mt-1 group-hover:text-white transition-colors">
                  {stat.count}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
            </Link>
          )
        })}
        <SEOSummaryCard />
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-card-bg border border-card-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Quick Publish Shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/articles/new"
            className="flex items-center justify-between p-4 bg-[#110f17] border border-card-border rounded-lg hover:border-neon-pink/40 hover:bg-neon-pink/5 transition duration-150 group"
          >
            <div className="flex items-center space-x-3">
              <PlusCircle className="text-neon-pink" size={20} />
              <div>
                <p className="text-sm font-semibold text-white">Create New Article</p>
                <p className="text-xs text-foreground/45">Write and publish an analytical news piece</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-foreground/40 group-hover:text-neon-pink transition" />
          </Link>

          <Link
            href="/admin/guides/new"
            className="flex items-center justify-between p-4 bg-[#110f17] border border-card-border rounded-lg hover:border-neon-blue/40 hover:bg-neon-blue/5 transition duration-150 group"
          >
            <div className="flex items-center space-x-3">
              <PlusCircle className="text-neon-blue" size={20} />
              <div>
                <p className="text-sm font-semibold text-white">Create New Guide</p>
                <p className="text-xs text-foreground/45">Publish a strategy walkthrough or secrets map</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-foreground/40 group-hover:text-neon-blue transition" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comment Moderation Queue */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="text-neon-pink" size={20} />
                <h2 className="text-lg font-bold text-white">Pending Moderation</h2>
              </div>
              <span className="bg-neon-pink/15 text-neon-pink text-xs font-bold px-2 py-0.5 rounded-full">
                {commentsCount.count || 0} Awaiting
              </span>
            </div>

            {pendingComments && pendingComments.length > 0 ? (
              <div className="divide-y divide-card-border/55 space-y-4">
                {pendingComments.map((comment) => (
                  <div key={comment.id} className="pt-4 first:pt-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-white">{comment.name}</p>
                      <span className="text-xs text-foreground/40">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/50 mt-1 line-clamp-1 italic">
                      on &quot;{(comment.articles as any)?.title || "Unknown Article"}&quot;
                    </p>
                    <p className="text-sm text-foreground/75 mt-2 line-clamp-2 bg-[#0b0a0e] p-2.5 rounded border border-card-border/50">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-card-border rounded-lg bg-[#0b0a0e]/40">
                <p className="text-sm text-foreground/40">No pending comments requiring action!</p>
              </div>
            )}
          </div>

          {pendingComments && pendingComments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-card-border">
              <Link
                href="/admin/comments"
                className="flex items-center justify-center text-sm font-bold text-neon-pink hover:underline"
              >
                Go to Moderation Queue <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Recently Updated Content */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="text-neon-blue" size={20} />
              <h2 className="text-lg font-bold text-white">Recently Updated</h2>
            </div>

            {recentUpdatesToShow.length > 0 ? (
              <div className="divide-y divide-card-border/55">
                {recentUpdatesToShow.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                      <p className="text-xs text-foreground/40 mt-0.5">{item.type}</p>
                    </div>
                    <div className="text-right flex items-center space-x-4">
                      <span className="text-xs text-foreground/45">
                        {item.updatedAt.toLocaleDateString()}
                      </span>
                      {item.href && (
                        <Link
                          href={item.href}
                          className="text-xs font-bold text-neon-blue hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-card-border rounded-lg bg-[#0b0a0e]/40">
                <p className="text-sm text-foreground/40">No content updated recently.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
