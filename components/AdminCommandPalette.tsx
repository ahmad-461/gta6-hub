"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Search, FileText, Award, Users, Key, HelpCircle, Loader2 } from "lucide-react"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdminCommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    articles: any[]
    guides: any[]
    characters: any[]
    cheats: any[]
  }>({
    articles: [],
    guides: [],
    characters: [],
    cheats: []
  })

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setResults({ articles: [], guides: [], characters: [], cheats: [] })
    }
  }, [isOpen])

  // ESC and outside click handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Live query search
  useEffect(() => {
    const term = query.trim().toLowerCase()
    if (term.length < 2) {
      setResults({ articles: [], guides: [], characters: [], cheats: [] })
      setLoading(false)
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const [artRes, guideRes, charRes, cheatRes] = await Promise.all([
          supabase
            .from("articles")
            .select("id, title")
            .ilike("title", `%${term}%`)
            .limit(5),
          supabase
            .from("guides")
            .select("id, title")
            .ilike("title", `%${term}%`)
            .limit(5),
          supabase
            .from("characters")
            .select("id, name")
            .ilike("name", `%${term}%`)
            .limit(5),
          supabase
            .from("cheat_codes")
            .select("id, title, code")
            .or(`title.ilike.%${term}%,code.ilike.%${term}%`)
            .limit(5)
        ])

        setResults({
          articles: artRes.data || [],
          guides: guideRes.data || [],
          characters: charRes.data || [],
          cheats: cheatRes.data || []
        })
      } catch (err) {
        console.error("[COMMAND_PALETTE] search failed:", err)
      } finally {
        setLoading(false)
      }
    }, 150)

    return () => clearTimeout(delayDebounce)
  }, [query])

  if (!isOpen) return null

  const handleSelect = (url: string) => {
    router.push(url)
    onClose()
  }

  const hasResults =
    results.articles.length > 0 ||
    results.guides.length > 0 ||
    results.characters.length > 0 ||
    results.cheats.length > 0

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 p-4 font-mono transition-opacity"
    >
      <div className="relative w-full max-w-2xl bg-[#150C1F] border border-[rgba(245,240,250,0.14)] rounded-xl shadow-[0_0_50px_rgba(255,46,136,0.1)] overflow-hidden flex flex-col max-h-[70vh]">
        {/* Top ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-magenta via-violet to-cyan"></div>

        {/* Input Bar */}
        <div className="flex items-center space-x-3 px-4 py-4 border-b border-[rgba(245,240,250,0.08)] bg-[#0B0710]/40">
          <Search size={18} className="text-[#9C8FAE]/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Articles, Guides, CharactersWiki, or Cheats by name/title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-white text-xs font-bold placeholder-[#9C8FAE]/30 outline-none focus:ring-0"
          />
          {loading && <Loader2 size={16} className="text-[#FF2E88] animate-spin" />}
          <span className="text-[9px] font-bold text-[#9C8FAE]/30 uppercase tracking-widest border border-[rgba(245,240,250,0.08)] px-1.5 py-0.5 rounded shadow-sm">
            ESC
          </span>
        </div>

        {/* Results Block */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {query.trim().length < 2 ? (
            <div className="text-center py-10 space-y-2 text-[#9C8FAE]/45">
              <HelpCircle size={28} className="mx-auto text-[#9C8FAE]/25" />
              <p className="text-[11px] font-bold uppercase tracking-wider">Unified Admin Terminal</p>
              <p className="text-[10px] leading-relaxed max-w-sm mx-auto">
                Start typing at least 2 characters to trigger an instantaneous multi-content index search.
              </p>
            </div>
          ) : hasResults ? (
            <div className="space-y-4">
              {/* Articles */}
              {results.articles.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[10px] font-black text-[#FF2E88] uppercase tracking-widest pl-1">
                    <FileText size={12} />
                    <span>Articles ({results.articles.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.articles.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => handleSelect(`/admin/articles/${art.id}`)}
                        className="w-full text-left p-2.5 rounded bg-[#0B0710]/40 hover:bg-[#FF2E88]/5 border border-[rgba(245,240,250,0.06)] hover:border-[#FF2E88]/20 text-xs font-bold text-white transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{art.title}</span>
                        <span className="text-[9px] font-bold text-[#9C8FAE]/40 uppercase tracking-widest">EDIT</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Guides */}
              {results.guides.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[10px] font-black text-[#00E5FF] uppercase tracking-widest pl-1">
                    <Award size={12} />
                    <span>Guides ({results.guides.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.guides.map((guide) => (
                      <button
                        key={guide.id}
                        onClick={() => handleSelect(`/admin/guides/${guide.id}`)}
                        className="w-full text-left p-2.5 rounded bg-[#0B0710]/40 hover:bg-[#00E5FF]/5 border border-[rgba(245,240,250,0.06)] hover:border-[#00E5FF]/20 text-xs font-bold text-white transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{guide.title}</span>
                        <span className="text-[9px] font-bold text-[#9C8FAE]/40 uppercase tracking-widest">EDIT</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Characters */}
              {results.characters.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[10px] font-black text-[#FF8A3D] uppercase tracking-widest pl-1">
                    <Users size={12} />
                    <span>Characters ({results.characters.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.characters.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => handleSelect(`/admin/characters/${char.id}`)}
                        className="w-full text-left p-2.5 rounded bg-[#0B0710]/40 hover:bg-[#FF8A3D]/5 border border-[rgba(245,240,250,0.06)] hover:border-[#FF8A3D]/20 text-xs font-bold text-white transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{char.name}</span>
                        <span className="text-[9px] font-bold text-[#9C8FAE]/40 uppercase tracking-widest">EDIT</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cheat Codes */}
              {results.cheats.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[10px] font-black text-[#A78BFA] uppercase tracking-widest pl-1">
                    <Key size={12} />
                    <span>Cheat Codes ({results.cheats.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.cheats.map((cheat) => (
                      <button
                        key={cheat.id}
                        onClick={() => handleSelect(`/admin/cheats?query=${encodeURIComponent(cheat.title)}`)}
                        className="w-full text-left p-2.5 rounded bg-[#0B0710]/40 hover:bg-[#A78BFA]/5 border border-[rgba(245,240,250,0.06)] hover:border-[#A78BFA]/20 text-xs font-bold text-white transition-all flex items-center justify-between"
                      >
                        <div className="truncate flex items-baseline space-x-2">
                          <span>{cheat.title}</span>
                          <span className="text-[10px] text-[#A78BFA]/60 font-mono">({cheat.code})</span>
                        </div>
                        <span className="text-[9px] font-bold text-[#9C8FAE]/40 uppercase tracking-widest">JUMP</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[#9C8FAE]/40 text-xs">
              No matching administrative records found for &ldquo;<span className="text-white font-bold">{query}</span>&rdquo;.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
