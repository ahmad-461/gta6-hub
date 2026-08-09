import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Shield, User, Landmark, Mic, Milestone } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // dynamically server-render

export const metadata = {
  title: "Meet the Characters",
  description: "Explore the core characters and players in Grand Theft Auto VI: backgrounds, voice actors, and lore.",
}

export default async function CharactersLandingPage() {
  const supabase = createSupabaseServerClient()

  let characters: any[] = []

  try {
    const { data } = await supabase
      .from("characters")
      .select("id, name, slug, biography, stats_json, featured_image")
      .eq("status", "published")
      .order("name")

    characters = data || []
  } catch (err) {
    console.error("Error loading characters landing page:", err)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow space-y-12">

      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
          Leonida <span className="bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">Characters</span>
        </h1>
        <p className="text-foreground/60 text-sm sm:text-base leading-relaxed">
          Get familiar with Lucia, Jason, and the major key players dominating the Vice City underworld.
        </p>
      </div>

      {/* CHARACTERS GRID */}
      {characters.length === 0 ? (
        <div className="border border-dashed border-card-border p-16 text-center rounded-lg bg-card-bg/50">
          <p className="text-foreground/40 text-lg mb-2 font-bold">No character profiles registered yet.</p>
          <Link href="/" className="text-neon-purple hover:underline text-sm font-semibold">
            Return Home &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {characters.map((char) => {
            const stats = char.stats_json || {}
            return (
              <div
                key={char.id}
                className="group bg-card-bg border border-card-border hover:border-neon-purple/30 rounded-lg overflow-hidden transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image wrapper */}
                  <div className="relative h-64 w-full bg-brand-dark overflow-hidden">
                    <Image
                      src={char.featured_image || "/placeholder-character.jpg"}
                      alt={char.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500 object-top"
                    />
                  </div>

                  {/* Body info */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-neon-purple transition-colors">
                      {char.name}
                    </h3>

                    <p className="text-xs text-foreground/60 line-clamp-3 leading-relaxed">
                      {char.biography}
                    </p>

                    {/* Quick Stats list */}
                    <div className="space-y-1.5 pt-3 border-t border-card-border/50 text-[11px] font-bold text-foreground/50">
                      {stats.role && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-neon-purple" />
                          <span className="truncate">{stats.role}</span>
                        </div>
                      )}
                      {stats.affiliation && (
                        <div className="flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-neon-purple" />
                          <span className="truncate">{stats.affiliation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/characters/${char.slug}`}
                    className="w-full text-center bg-background group-hover:bg-neon-purple/10 border border-card-border group-hover:border-neon-purple hover:brightness-110 text-white font-bold text-xs uppercase py-2.5 rounded transition-all block"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
