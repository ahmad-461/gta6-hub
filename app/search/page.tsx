"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, FileText, Award, User, Loader2, Calendar, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    articles: any[]
    guides: any[]
    characters: any[]
  }>({ articles: [], guides: [], characters: [] })

  const [loading, setLoading] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (query.trim() === "") {
      setResults({ articles: [], guides: [], characters: [] })
      setLoading(false)
      return
    }

    setLoading(true)

    // Debounce search by 300ms
    debounceTimer.current = setTimeout(async () => {
      const q = query.trim()

      try {
        const searchFormatted = q.split(/\s+/).join(" & ")

        // Query articles, guides, and characters simultaneously
        const [articlesRes, guidesRes, charactersRes] = await Promise.all([
          // 1. Articles Search
          (async () => {
            // Try Full-Text Search
            const { data, error } = await supabase
              .from("articles")
              .select("id, title, slug, excerpt, featured_image, published_at, category ( name, slug )")
              .eq("status", "published")
              .textSearch("title", searchFormatted, { config: "english" })
              .limit(10)

            if (error || !data || data.length === 0) {
              // Fallback to ilike
              const { data: fallbackData } = await supabase
                .from("articles")
                .select("id, title, slug, excerpt, featured_image, published_at, category ( name, slug )")
                .eq("status", "published")
                .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`)
                .limit(10)
              return fallbackData || []
            }
            return data
          })(),

          // 2. Guides Search
          (async () => {
            // Try Full-Text Search
            const { data, error } = await supabase
              .from("guides")
              .select("id, title, slug, featured_image, published_at, difficulty, category ( name, slug )")
              .eq("status", "published")
              .textSearch("title", searchFormatted, { config: "english" })
              .limit(10)

            if (error || !data || data.length === 0) {
              // Fallback to ilike
              const { data: fallbackData } = await supabase
                .from("guides")
                .select("id, title, slug, featured_image, published_at, difficulty, category ( name, slug )")
                .eq("status", "published")
                .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
                .limit(10)
              return fallbackData || []
            }
            return data
          })(),

          // 3. Characters Search
          (async () => {
            // Try Full-Text Search
            const { data, error } = await supabase
              .from("characters")
              .select("id, name, slug, biography, stats_json, featured_image")
              .eq("status", "published")
              .textSearch("name", searchFormatted, { config: "english" })
              .limit(10)

            if (error || !data || data.length === 0) {
              // Fallback to ilike
              const { data: fallbackData } = await supabase
                .from("characters")
                .select("id, name, slug, biography, stats_json, featured_image")
                .eq("status", "published")
                .or(`name.ilike.%${q}%,biography.ilike.%${q}%`)
                .limit(10)
              return fallbackData || []
            }
            return data
          })()
        ])

        setResults({
          articles: articlesRes,
          guides: guidesRes,
          characters: charactersRes
        })
      } catch (err) {
        console.error("Error during search:", err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query])

  const totalResults = results.articles.length + results.guides.length + results.characters.length

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow space-y-12">

      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase flex justify-center items-center gap-3">
          <Search className="w-8 h-8 sm:w-12 sm:h-12 text-neon-pink" />
          <span>Leonida <span className="bg-gradient-to-r from-neon-pink to-neon-blue bg-clip-text text-transparent">Search</span></span>
        </h1>
        <p className="text-foreground/60 text-sm sm:text-base leading-relaxed">
          Search dynamically across standard breaking news, expert guides, and detailed character entries instantly.
        </p>

        {/* INPUT */}
        <div className="relative max-w-xl mx-auto pt-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-card-bg border border-card-border focus:border-neon-pink/60 rounded-lg pl-12 pr-12 py-4 text-base text-foreground focus:outline-none transition-all placeholder:text-foreground/45 shadow-2xl"
            placeholder="Type standard tags, character names, heists codes..."
            autoFocus
          />
          <Search className="absolute left-4.5 top-[29px] w-5 h-5 text-foreground/45" />
          {loading && (
            <Loader2 className="absolute right-4.5 top-[29px] w-5 h-5 text-neon-pink animate-spin" />
          )}
        </div>
      </div>

      {/* RESULTS SECTIONS */}
      {query.trim() !== "" && !loading && (
        <div className="space-y-12">

          <div className="text-xs font-black uppercase tracking-widest text-foreground/50 border-b border-card-border pb-3 flex justify-between items-center">
            <span>Search Results</span>
            <span className="text-neon-pink font-black bg-neon-pink/10 px-2 py-0.5 rounded border border-neon-pink/20">
              {totalResults} {totalResults === 1 ? "Result" : "Results"} Found
            </span>
          </div>

          {totalResults === 0 ? (
            <div className="border border-dashed border-card-border p-16 text-center rounded-lg bg-card-bg/50 max-w-xl mx-auto">
              <p className="text-foreground/40 text-lg mb-2 font-black">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-foreground/50">Check spelling or try using simpler terms (e.g., &ldquo;Lucia&rdquo;, &ldquo;Cheat&rdquo;, &ldquo;Heist&rdquo;).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* 1. ARTICLES */}
              <div className="space-y-6">
                <h3 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2 border-b border-card-border pb-3">
                  <FileText className="w-4 h-4 text-neon-pink" />
                  Articles ({results.articles.length})
                </h3>

                {results.articles.length === 0 ? (
                  <p className="text-xs text-foreground/40 italic">No matching articles.</p>
                ) : (
                  <div className="space-y-4">
                    {results.articles.map((art) => (
                      <Link
                        key={art.id}
                        href={`/news/${art.slug}`}
                        className="group flex gap-4 p-3 rounded-md bg-card-bg/50 hover:bg-card-bg border border-card-border/40 hover:border-neon-pink/30 transition-all duration-200"
                      >
                        <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-brand-dark">
                          <Image
                            src={art.featured_image || "/placeholder-card.jpg"}
                            alt={art.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow min-w-0 space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-neon-pink transition-colors truncate">
                            {art.title}
                          </h4>
                          <p className="text-[11px] text-foreground/60 line-clamp-2 leading-relaxed">
                            {art.excerpt}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. GUIDES */}
              <div className="space-y-6">
                <h3 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2 border-b border-card-border pb-3">
                  <Award className="w-4 h-4 text-neon-blue" />
                  Walkthroughs ({results.guides.length})
                </h3>

                {results.guides.length === 0 ? (
                  <p className="text-xs text-foreground/40 italic">No matching walkthroughs.</p>
                ) : (
                  <div className="space-y-4">
                    {results.guides.map((g) => (
                      <Link
                        key={g.id}
                        href={`/guides/${g.category?.slug || "general"}/${g.slug}`}
                        className="group flex gap-4 p-3 rounded-md bg-card-bg/50 hover:bg-card-bg border border-card-border/40 hover:border-neon-blue/30 transition-all duration-200"
                      >
                        <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-brand-dark">
                          <Image
                            src={g.featured_image || "/placeholder-card.jpg"}
                            alt={g.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow min-w-0 space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-neon-blue transition-colors truncate">
                            {g.title}
                          </h4>
                          <span className="text-[10px] uppercase font-black text-neon-blue">
                            {g.category?.name || "General"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. CHARACTERS */}
              <div className="space-y-6">
                <h3 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2 border-b border-card-border pb-3">
                  <User className="w-4 h-4 text-neon-purple" />
                  Characters ({results.characters.length})
                </h3>

                {results.characters.length === 0 ? (
                  <p className="text-xs text-foreground/40 italic">No matching characters.</p>
                ) : (
                  <div className="space-y-4">
                    {results.characters.map((char) => (
                      <Link
                        key={char.id}
                        href={`/characters/${char.slug}`}
                        className="group flex gap-4 p-3 rounded-md bg-card-bg/50 hover:bg-card-bg border border-card-border/40 hover:border-neon-purple/30 transition-all duration-200"
                      >
                        <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-brand-dark">
                          <Image
                            src={char.featured_image || "/placeholder-character.jpg"}
                            alt={char.name}
                            fill
                            unoptimized
                            className="object-cover object-top"
                          />
                        </div>
                        <div className="flex-grow min-w-0 space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-neon-purple transition-colors truncate">
                            {char.name}
                          </h4>
                          <p className="text-[11px] text-foreground/60 line-clamp-2 leading-relaxed">
                            {char.biography}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  )
}
