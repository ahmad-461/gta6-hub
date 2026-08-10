"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Search, FileText, Award, Swords, Loader2 } from "lucide-react"

interface SearchResultArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  published_at: string
}

interface SearchResultGuide {
  id: string
  title: string
  slug: string
  guide_category: string
  difficulty: string
}

interface SearchResultCharacter {
  id: string
  name: string
  slug: string
  biography: string
}

export default function SearchClient() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    articles: SearchResultArticle[]
    guides: SearchResultGuide[]
    characters: SearchResultCharacter[]
  }>({
    articles: [],
    guides: [],
    characters: [],
  })

  // Debounce query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300) // 300ms

    return () => clearTimeout(handler)
  }, [query])

  // Trigger search when debouncedQuery changes
  useEffect(() => {
    const performSearch = async () => {
      const trimmed = debouncedQuery.trim()
      if (trimmed.length < 2) {
        setResults({ articles: [], guides: [], characters: [] })
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [articlesRes, guidesRes, charactersRes] = await Promise.all([
          supabase
            .from("articles")
            .select("id, title, slug, excerpt, published_at")
            .eq("status", "published")
            .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
            .limit(10),
          supabase
            .from("guides")
            .select("id, title, slug, guide_category, difficulty")
            .eq("status", "published")
            .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
            .limit(10),
          supabase
            .from("characters")
            .select("id, name, slug, biography")
            .eq("status", "published")
            .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
            .limit(10),
        ])

        setResults({
          articles: (articlesRes.data || []) as SearchResultArticle[],
          guides: (guidesRes.data || []) as SearchResultGuide[],
          characters: (charactersRes.data || []) as SearchResultCharacter[],
        })
      } catch (err) {
        console.error("Search failed:", err)
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  const hasAnyResults =
    results.articles.length > 0 || results.guides.length > 0 || results.characters.length > 0

  return (
    <div className="space-y-8">
      {/* Search Input Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type keywords to search articles, walkthroughs, or cast lore..."
          className="w-full bg-card-bg border border-card-border rounded-xl pl-12 pr-12 py-3.5 text-base text-white placeholder-foreground/30 focus:outline-none focus:border-neon-pink/70 transition-all duration-200 shadow-lg"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neon-pink animate-spin" />
        )}
      </div>

      {/* Results Block */}
      {debouncedQuery.trim().length >= 2 ? (
        <div className="space-y-8">
          {hasAnyResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Articles Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white border-b border-card-border pb-2.5">
                  <FileText className="w-5 h-5 text-neon-pink" />
                  <h3 className="font-extrabold uppercase text-xs tracking-widest">
                    Articles ({results.articles.length})
                  </h3>
                </div>

                {results.articles.length > 0 ? (
                  <div className="space-y-3">
                    {results.articles.map((art) => (
                      <Link
                        key={art.id}
                        href={`/news/${art.slug}`}
                        className="block p-4 rounded-lg bg-card-bg border border-card-border hover:border-neon-pink/30 transition-all duration-200"
                      >
                        <h4 className="font-bold text-sm text-white hover:text-neon-pink transition-colors line-clamp-1 leading-snug">
                          {art.title}
                        </h4>
                        <p className="text-[11px] text-foreground/50 leading-relaxed line-clamp-2 mt-1">
                          {art.excerpt}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground/40 italic">No articles match your search.</p>
                )}
              </div>

              {/* Guides Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white border-b border-card-border pb-2.5">
                  <Award className="w-5 h-5 text-neon-blue" />
                  <h3 className="font-extrabold uppercase text-xs tracking-widest">
                    Guides ({results.guides.length})
                  </h3>
                </div>

                {results.guides.length > 0 ? (
                  <div className="space-y-3">
                    {results.guides.map((guide) => (
                      <Link
                        key={guide.id}
                        href={`/guides/${guide.guide_category.toLowerCase().replace(/\s+/g, "-")}/${guide.slug}`}
                        className="block p-4 rounded-lg bg-card-bg border border-card-border hover:border-neon-blue/30 transition-all duration-200"
                      >
                        <h4 className="font-bold text-sm text-white hover:text-neon-blue transition-colors line-clamp-1 leading-snug">
                          {guide.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 text-[9px] font-bold uppercase tracking-wider">
                          <span className="text-neon-purple">{guide.guide_category}</span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            guide.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400" :
                            guide.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400" :
                            "bg-rose-500/10 text-rose-400"
                          }`}>
                            {guide.difficulty}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground/40 italic">No guides match your search.</p>
                )}
              </div>

              {/* Characters Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white border-b border-card-border pb-2.5">
                  <Swords className="w-5 h-5 text-neon-purple" />
                  <h3 className="font-extrabold uppercase text-xs tracking-widest">
                    Characters ({results.characters.length})
                  </h3>
                </div>

                {results.characters.length > 0 ? (
                  <div className="space-y-3">
                    {results.characters.map((char) => (
                      <Link
                        key={char.id}
                        href={`/characters/${char.slug}`}
                        className="block p-4 rounded-lg bg-card-bg border border-card-border hover:border-neon-purple/30 transition-all duration-200"
                      >
                        <h4 className="font-bold text-sm text-white hover:text-neon-purple transition-colors line-clamp-1 leading-snug">
                          {char.name}
                        </h4>
                        <p className="text-[11px] text-foreground/50 leading-relaxed line-clamp-2 mt-1">
                          {char.biography.replace(/<[^>]*>/g, "")}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground/40 italic">No characters match your search.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-foreground/40 text-sm border border-dashed border-card-border rounded-xl bg-card-bg/30">
              No results found for &ldquo;<span className="text-white font-bold">{debouncedQuery}</span>&rdquo;.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-foreground/30 text-sm border border-dashed border-card-border rounded-xl bg-card-bg/20 max-w-2xl mx-auto">
          Start typing above (at least 2 characters) to search Leonida records...
        </div>
      )}
    </div>
  )
}
