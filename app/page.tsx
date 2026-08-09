import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MessageSquare, Twitter, Disc, HelpCircle, ArrowRight, Eye } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import CountdownTimer from "@/components/CountdownTimer"
import CommunityPoll from "@/components/CommunityPoll"

export const revalidate = 0 // always fetch fresh data on homepage

export default async function HomePage() {
  const supabase = createSupabaseServerClient()

  // Gracefully fetch all data
  let settings: Record<string, string> = {}
  let featuredArticle: any = null
  let latestArticles: any[] = []
  let latestTeaser: any = null
  let latestGuides: any[] = []
  let recentComments: any[] = []
  let activePoll: any = null

  try {
    const [
      { data: settingsData },
      { data: featuredData },
      { data: articlesData },
      { data: guidesData },
      { data: commentsData },
      { data: pollsData }
    ] = await Promise.all([
      supabase.from("site_settings").select("*"),
      supabase.from("articles").select(`
        id, title, slug, excerpt, featured_image, published_at, category ( name, slug )
      `).eq("status", "published").eq("featured", true).order("published_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("articles").select(`
        id, title, slug, excerpt, featured_image, published_at, category ( name, slug )
      `).eq("status", "published").order("published_at", { ascending: false }).limit(6),
      supabase.from("guides").select(`
        id, title, slug, featured_image, published_at, difficulty, category ( name, slug )
      `).eq("status", "published").order("published_at", { ascending: false }).limit(3),
      supabase.from("comments").select(`
        id, name, content, created_at, articles ( title, slug )
      `).eq("status", "approved").order("created_at", { ascending: false }).limit(5),
      supabase.from("polls").select("*").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ])

    settings = Object.fromEntries(settingsData?.map((s) => [s.key, s.value]) || [])
    featuredArticle = featuredData
    latestArticles = articlesData || []
    latestGuides = guidesData || []
    recentComments = commentsData || []
    activePoll = pollsData

    // Get the latest article for hero teaser
    if (latestArticles.length > 0) {
      latestTeaser = latestArticles[0]
    }

    // Fallback if no featured article is explicitly set
    if (!featuredArticle && latestArticles.length > 0) {
      featuredArticle = latestArticles[0]
    }
  } catch (error) {
    console.error("Error loading homepage data:", error)
  }

  const countdownTarget = settings.countdown_target || "2026-11-19T00:00:00-05:00"

  // Helper for formatting date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="flex-grow flex flex-col bg-background text-foreground">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-card-border bg-brand-dark/40 py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: "url('/hero-bg.jpg')" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-neon-pink/15 to-neon-blue/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 space-y-8">
          {latestTeaser && (
            <Link
              href={`/news/${latestTeaser.slug}`}
              className="inline-flex items-center gap-2 bg-neon-pink/10 border border-neon-pink/30 hover:border-neon-pink text-neon-pink text-xs font-bold px-4 py-1.5 rounded-full transition-all duration-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-neon-pink animate-ping" />
              LATEST NEWS: {latestTeaser.title} &rarr;
            </Link>
          )}

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight">
              LEONIDA&apos;S ULTIMATE{" "}
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(255,0,127,0.15)]">
                GTA VI HUB
              </span>
            </h1>
            <p className="text-base sm:text-lg text-foreground/85 max-w-2xl mx-auto leading-relaxed">
              Dive deep into Rockstar&apos;s next generation masterpiece. Read breaking news, explore exhaustive mission walkthroughs, character bios, and multi-platform cheat codes.
            </p>
          </div>

          <div className="space-y-4 w-full max-w-lg">
            <h3 className="text-xs font-bold tracking-widest text-foreground/55 text-center">
              GTA VI RELEASE COUNTDOWN
            </h3>
            <CountdownTimer targetDateString={countdownTarget} />
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/news"
              className="px-8 py-3.5 rounded-md font-bold bg-gradient-to-r from-neon-pink to-neon-purple hover:brightness-110 text-white transition-all duration-300 shadow-lg shadow-neon-pink/25 text-sm"
            >
              Explore News Feed
            </Link>
            <Link
              href="/cheats"
              className="px-8 py-3.5 rounded-md font-bold bg-transparent border border-neon-blue hover:bg-neon-blue/10 text-neon-blue transition-all duration-300 shadow-lg shadow-neon-blue/10 text-sm"
            >
              Cheat Codes
            </Link>
          </div>
        </div>
      </section>

      {/* 2. BODY GRID */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT CONTENT: Articles & Guides */}
          <div className="lg:col-span-8 space-y-16">

            {/* FEATURED ARTICLE */}
            {featuredArticle && (
              <div className="space-y-6">
                <h2 className="text-xl font-black tracking-wider text-white uppercase flex items-center gap-3">
                  <span className="w-1 h-6 bg-neon-pink" />
                  Featured Story
                </h2>
                <div className="group bg-card-bg border border-card-border hover:border-neon-pink/30 rounded-lg overflow-hidden transition-all duration-300 flex flex-col md:flex-row shadow-2xl">
                  <div className="relative w-full md:w-1/2 h-64 md:h-auto min-h-[250px]">
                    <Image
                      src={featuredArticle.featured_image || "/placeholder-featured.jpg"}
                      alt={featuredArticle.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-between md:w-1/2 space-y-6">
                    <div className="space-y-3">
                      {featuredArticle.category && (
                        <span className="text-xs font-bold text-neon-pink tracking-widest uppercase">
                          {featuredArticle.category.name}
                        </span>
                      )}
                      <h3 className="text-2xl font-bold text-white group-hover:text-neon-pink transition-colors line-clamp-2">
                        {featuredArticle.title}
                      </h3>
                      <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">
                        {featuredArticle.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-card-border text-xs text-foreground/55 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neon-pink" />
                        {formatDate(featuredArticle.published_at)}
                      </span>
                      <Link
                        href={`/news/${featuredArticle.slug}`}
                        className="inline-flex items-center gap-1 text-neon-pink hover:underline"
                      >
                        Read Full Story <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LATEST NEWS */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-black tracking-wider text-white uppercase flex items-center gap-3">
                  <span className="w-1 h-6 bg-neon-purple" />
                  Latest News
                </h2>
                <Link href="/news" className="text-xs font-bold text-neon-purple hover:underline flex items-center gap-1">
                  View All News <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {latestArticles.length === 0 ? (
                <div className="border border-dashed border-card-border p-8 text-center rounded-lg text-foreground/40 text-sm">
                  No published news articles available.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestArticles.map((article) => (
                    <div
                      key={article.id}
                      className="group bg-card-bg border border-card-border hover:border-neon-purple/30 rounded-lg overflow-hidden transition-all duration-300 flex flex-col"
                    >
                      <div className="relative h-44 w-full bg-brand-dark">
                        <Image
                          src={article.featured_image || "/placeholder-card.jpg"}
                          alt={article.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          {article.category && (
                            <span className="text-[10px] font-bold text-neon-purple tracking-widest uppercase">
                              {article.category.name}
                            </span>
                          )}
                          <Link href={`/news/${article.slug}`}>
                            <h4 className="text-base font-bold text-white hover:text-neon-purple transition-colors line-clamp-2">
                              {article.title}
                            </h4>
                          </Link>
                          <p className="text-xs text-foreground/60 line-clamp-2 leading-relaxed">
                            {article.excerpt}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-card-border flex items-center justify-between text-[11px] font-bold text-foreground/50">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-neon-purple" />
                            {formatDate(article.published_at)}
                          </span>
                          <Link href={`/news/${article.slug}`} className="text-neon-purple hover:underline">
                            Read &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LATEST GUIDES */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-black tracking-wider text-white uppercase flex items-center gap-3">
                  <span className="w-1 h-6 bg-neon-blue" />
                  Walkthroughs & Guides
                </h2>
                <Link href="/guides" className="text-xs font-bold text-neon-blue hover:underline flex items-center gap-1">
                  View All Guides <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {latestGuides.length === 0 ? (
                <div className="border border-dashed border-card-border p-8 text-center rounded-lg text-foreground/40 text-sm">
                  No published guides available.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {latestGuides.map((guide) => (
                    <div
                      key={guide.id}
                      className="group bg-card-bg border border-card-border hover:border-neon-blue/30 rounded-lg overflow-hidden transition-all duration-300 flex flex-col"
                    >
                      <div className="relative h-40 w-full bg-brand-dark">
                        <Image
                          src={guide.featured_image || "/placeholder-card.jpg"}
                          alt={guide.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {guide.difficulty && (
                          <div className="absolute top-3 right-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                              guide.difficulty === "easy" ? "bg-emerald-500 text-white" :
                              guide.difficulty === "medium" ? "bg-amber-500 text-white" :
                              "bg-rose-500 text-white"
                            }`}>
                              {guide.difficulty}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          {guide.category && (
                            <span className="text-[10px] font-bold text-neon-blue tracking-widest uppercase">
                              {guide.category.name}
                            </span>
                          )}
                          <Link href={`/guides/${guide.category?.slug || "general"}/${guide.slug}`}>
                            <h4 className="text-sm font-bold text-white hover:text-neon-blue transition-colors line-clamp-2">
                              {guide.title}
                            </h4>
                          </Link>
                        </div>
                        <div className="pt-3 border-t border-card-border flex items-center justify-between text-[11px] font-bold text-foreground/50">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-neon-blue" />
                            {formatDate(guide.published_at)}
                          </span>
                          <Link
                            href={`/guides/${guide.category?.slug || "general"}/${guide.slug}`}
                            className="text-neon-blue hover:underline"
                          >
                            Explore &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT CONTENT: Sidebar */}
          <div className="lg:col-span-4 space-y-10">

            {/* COMMUNITY POLL */}
            {activePoll && (
              <CommunityPoll initialPoll={activePoll} />
            )}

            {/* SOCIAL LINKS */}
            <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-4">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                <Disc className="w-4 h-4 text-neon-blue animate-spin" style={{ animationDuration: "3s" }} />
                Connect With Us
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {settings.social_x && (
                  <a
                    href={settings.social_x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-background border border-card-border hover:border-neon-pink p-3 rounded-md text-xs font-semibold text-foreground/80 hover:text-white transition-all duration-200"
                  >
                    <Twitter className="w-4 h-4 text-neon-pink" /> Twitter/X
                  </a>
                )}
                {settings.social_reddit && (
                  <a
                    href={settings.social_reddit}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-background border border-card-border hover:border-neon-purple p-3 rounded-md text-xs font-semibold text-foreground/80 hover:text-white transition-all duration-200"
                  >
                    <HelpCircle className="w-4 h-4 text-neon-purple" /> Reddit
                  </a>
                )}
                {settings.social_discord && (
                  <a
                    href={settings.social_discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-background border border-card-border hover:border-neon-blue p-3 rounded-md text-xs font-semibold text-foreground/80 hover:text-white transition-all duration-200"
                  >
                    <Disc className="w-4 h-4 text-neon-blue" /> Discord
                  </a>
                )}
                {/* Fallbacks if empty settings */}
                {!settings.social_x && !settings.social_reddit && !settings.social_discord && (
                  <div className="col-span-2 text-xs text-foreground/40 font-bold py-2">
                    Follow us on social channels to receive real-time updates!
                  </div>
                )}
              </div>
            </div>

            {/* RECENT DISCUSSIONS / COMMENTS */}
            <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-6">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neon-pink" />
                Latest Comments
              </h3>

              {recentComments.length === 0 ? (
                <div className="text-xs text-foreground/40 font-bold">
                  No approved comments found.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentComments.map((comment) => (
                    <div key={comment.id} className="border-b border-card-border pb-3 last:border-0 last:pb-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-neon-pink">{comment.name}</span>
                        <span className="text-[10px] text-foreground/40 font-bold">
                          {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 italic line-clamp-2">
                        &ldquo;{comment.content}&rdquo;
                      </p>
                      {comment.articles && (
                        <div className="pt-1">
                          <Link
                            href={`/news/${comment.articles.slug}`}
                            className="text-[10px] text-foreground/50 hover:text-neon-pink font-semibold flex items-center gap-1 line-clamp-1"
                          >
                            on &ldquo;{comment.articles.title}&rdquo; &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MINI ABOUT BOX */}
            <div className="bg-card-bg border border-card-border rounded-lg p-6 space-y-4">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase">
                About GTA VI HUB
              </h3>
              <p className="text-xs text-foreground/60 leading-relaxed">
                GTA VI HUB is a premium, fan-created interactive resource dedicated to bringing you the most reliable Leonida news coverage, multiplatform game walkthroughs, and verified cheat codes.
              </p>
              <div className="pt-2 border-t border-card-border">
                <Link href="/about" className="text-xs text-neon-blue hover:underline font-bold flex items-center gap-1">
                  Learn More About Us <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>
    </div>
  )
}
