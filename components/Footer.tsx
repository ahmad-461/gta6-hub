"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Github, Linkedin, Twitter, Youtube, Disc, BarChart3, Activity } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface LiveStats {
  articlesCount: number
  guidesCount: number
  lastUpdated: string
}

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [stats, setStats] = useState<LiveStats>({
    articlesCount: 47,
    guidesCount: 12,
    lastUpdated: "2h ago",
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await supabase.from("site_settings").select("key, value")
        if (data) {
          const mapped = data.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
          }, {} as Record<string, string>)
          setSettings(mapped)
        }
      } catch (e) {
        console.error("Error loading settings in footer:", e)
      }
    }

    async function fetchLiveStats() {
      try {
        // Query counts for published articles and guides
        const { count: articlesCount, error: err1 } = await supabase
          .from("articles")
          .select("*", { count: "exact", head: true })
          .eq("status", "published")

        const { count: guidesCount, error: err2 } = await supabase
          .from("guides")
          .select("*", { count: "exact", head: true })
          .eq("status", "published")

        // Query the most recently published or updated article/guide to compute a dynamic "Last Updated"
        const { data: latestArticle } = await supabase
          .from("articles")
          .select("created_at, published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(1)

        const { data: latestGuide } = await supabase
          .from("guides")
          .select("created_at, published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(1)

        let mostRecentDate: Date | null = null

        const processDate = (dateStr?: string) => {
          if (!dateStr) return
          const d = new Date(dateStr)
          if (!isNaN(d.getTime())) {
            if (!mostRecentDate || d > mostRecentDate) {
              mostRecentDate = d
            }
          }
        }

        if (latestArticle && latestArticle[0]) {
          processDate(latestArticle[0].published_at || latestArticle[0].created_at)
        }
        if (latestGuide && latestGuide[0]) {
          processDate(latestGuide[0].published_at || latestGuide[0].created_at)
        }

        let timeString = "2h ago"
        if (mostRecentDate) {
          const diffMs = Date.now() - (mostRecentDate as Date).getTime()
          const diffMin = Math.floor(diffMs / 60000)
          const diffHr = Math.floor(diffMin / 60)
          const diffDay = Math.floor(diffHr / 24)

          if (diffMin < 60) {
            timeString = `${Math.max(1, diffMin)}m ago`
          } else if (diffHr < 24) {
            timeString = `${diffHr}h ago`
          } else {
            timeString = `${diffDay}d ago`
          }
        }

        setStats({
          articlesCount: articlesCount !== null && articlesCount !== undefined ? articlesCount : 47,
          guidesCount: guidesCount !== null && guidesCount !== undefined ? guidesCount : 12,
          lastUpdated: timeString,
        })
      } catch (e) {
        console.error("Error fetching live stats in footer:", e)
      }
    }

    fetchSettings()
    fetchLiveStats()
  }, [])

  // Check which settings are present
  const twitterUrl = settings["social_twitter"] || ""
  const redditUrl = settings["social_reddit"] || ""
  const discordUrl = settings["social_discord"] || ""
  const youtubeUrl = settings["social_youtube"] || ""

  const hasTwitter = !!twitterUrl
  const hasDiscord = !!discordUrl
  const hasYoutube = !!youtubeUrl

  const navLinks = [
    { name: "News", href: "/news" },
    { name: "Guides", href: "/guides" },
    { name: "Characters", href: "/characters" },
    { name: "Map", href: "/map" },
    { name: "Cheats", href: "/cheats" },
    { name: "Tools", href: "/tools" },
  ]

  const legalLinks = [
    { name: "About Us", href: "/about" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <footer className="relative bg-ink-2 mt-auto pt-16 pb-8 overflow-hidden font-mono border-t border-transparent">
      {/* Visual Treatment: Top Pink-to-Orange thin gradient line with radial neon glow corner anchor */}
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-magenta via-[#832258] to-orange" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-orange/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-magenta/3 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Film grain pattern matching the homepage */}
      <div className="film-grain opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 xl:gap-12 pb-12 border-b border-[rgba(245,245,247,0.14)]">
          {/* Column 1: Logo & Tagline */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange"></span>
              </span>
              <span className="text-xl font-normal tracking-wider text-paper font-anton uppercase">
                GTA6<span className="text-magenta">HUB</span>
              </span>
            </Link>
            <p className="text-xs text-paper-dim leading-relaxed max-w-sm">
              The ultimate unofficial resource and community hub for Grand Theft Auto VI.
            </p>
            <div className="text-[10px] text-paper-dim/60 uppercase tracking-widest font-mono pt-2 font-black">
              BUILD. SHIP. ITERATE.
            </div>

            {/* Signature Element: Option B - Live Stats Indicator */}
            <div className="pt-4 flex items-center space-x-2 animate-pulse motion-reduce:animate-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                Live Stats Feed
              </span>
            </div>
            <div className="text-[11px] font-bold text-paper-dim font-mono bg-ink/60 border border-[rgba(245,245,247,0.08)] px-3 py-2.5 rounded-lg space-y-1 inline-block">
              <div className="flex items-center gap-1.5 text-[10px] text-orange font-black uppercase">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>INTELLIGENCE PULSE</span>
              </div>
              <div className="text-[10px] text-paper/90 leading-relaxed font-semibold">
                <span className="text-white font-black">{stats.articlesCount}</span> Articles &bull; <span className="text-white font-black">{stats.guidesCount}</span> Guides
              </div>
              <div className="text-[9px] text-paper-dim/60 uppercase tracking-widest font-black flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500" />
                <span>Last Synchronized: {stats.lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Site Navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-paper uppercase tracking-widest border-b border-[rgba(245,245,247,0.08)] pb-2">
              Navigation
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="relative text-paper-dim hover:text-white transition-colors py-1 group block"
                  >
                    <span>{link.name}</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-orange w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Affiliate */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-paper uppercase tracking-widest border-b border-[rgba(245,245,247,0.08)] pb-2">
              Information
            </h4>
            <ul className="space-y-2.5 text-xs">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="relative text-paper-dim hover:text-white transition-colors py-1 group inline-block"
                  >
                    <span>{link.name}</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-orange w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-paper-dim/60 leading-relaxed italic pt-2 border-t border-[rgba(245,245,247,0.08)]">
              Disclosure: This page contains affiliate links. If you make a purchase through them, we may earn a small commission at no extra cost to you.
            </p>
          </div>

          {/* Column 4: Connect */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-paper uppercase tracking-widest border-b border-[rgba(245,245,247,0.08)] pb-2">
              Connect
            </h4>
            <ul className="space-y-2.5 text-xs">
              {/* GitHub */}
              <li>
                <a
                  href="https://github.com/ahmad-461"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center space-x-2 text-paper-dim hover:text-white transition-colors py-1 group inline-flex"
                >
                  <Github className="w-4 h-4 text-orange" />
                  <span>GitHub</span>
                  <span className="absolute bottom-0 left-0 h-[1.5px] bg-orange w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                </a>
              </li>
              {/* LinkedIn */}
              <li>
                <a
                  href="https://www.linkedin.com/in/ahmad-khan-77441833a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center space-x-2 text-paper-dim hover:text-white transition-colors py-1 group inline-flex"
                >
                  <Linkedin className="w-4 h-4 text-orange" />
                  <span>LinkedIn</span>
                  <span className="absolute bottom-0 left-0 h-[1.5px] bg-orange w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                </a>
              </li>
              {/* Conditional Site Settings Socials */}
              {hasTwitter && (
                <li>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center space-x-2 text-paper-dim hover:text-white transition-colors py-1 group inline-flex"
                  >
                    <Twitter className="w-4 h-4 text-orange" />
                    <span>Twitter / X</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-orange w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </a>
                </li>
              )}
              {hasYoutube && (
                <li>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center space-x-2 text-paper-dim hover:text-white transition-colors py-1 group inline-flex"
                  >
                    <Youtube className="w-4 h-4 text-orange" />
                    <span>YouTube</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-orange w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </a>
                </li>
              )}
              {hasDiscord && (
                <li>
                  <a
                    href={discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center space-x-2 text-paper-dim hover:text-white transition-colors py-1 group inline-flex"
                  >
                    <Disc className="w-4 h-4 text-orange" />
                    <span>Discord</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-orange w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Sub-row */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-[11px] text-paper-dim/50 space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <span>&copy; {currentYear} GTA6 HUB. All rights reserved.</span>
            <span className="hidden sm:inline text-white/10">|</span>
            <span className="font-mono text-[10px] text-paper-dim/70 hover:text-orange transition">
              Built by <a href="https://github.com/ahmad-461" target="_blank" rel="noopener noreferrer" className="underline font-black">Ahmad Khan</a>
            </span>
          </div>
          <div className="text-center sm:text-right max-w-md sm:max-w-none">
            <span>Fan-made, unofficial project. Grand Theft Auto, Vice City, Rockstar Games are trademarks of Take-Two Interactive.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
