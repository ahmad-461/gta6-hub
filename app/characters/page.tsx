import React from "react"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Swords, UserCheck } from "lucide-react"

export const metadata = {
  title: "Meet the Characters | GTA VI Hub",
  description: "Explore backgrounds, statistics, voice actors, and deep lore for Lucia, Jason, and the Vice City cast.",
}

function getImageUrl(url?: string | null) {
  if (!url) return "/og-image.jpg"
  return url
}

export default async function CharactersPage() {
  const supabase = createSupabaseServerClient()

  // Fetch all characters where status = 'published'
  const { data: characters } = await supabase
    .from("characters")
    .select("id, name, slug, biography, featured_image, stats_json")
    .eq("status", "published")
    .order("name")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white flex items-center gap-2">
          <Swords className="w-8 h-8 sm:w-12 sm:h-12 text-neon-purple" />
          Characters Database
        </h1>
        <p className="text-foreground/60 max-w-2xl leading-relaxed text-sm sm:text-base">
          Meet the protagonists, rivals, allies, and kingpins operating across Vice City and the surrounding state of Leonida.
        </p>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-card-border/60 via-transparent to-transparent" />

      {/* Characters Grid */}
      {characters && characters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((char) => {
            const role = (char.stats_json as any)?.role || "Unknown Role"
            return (
              <div
                key={char.id}
                className="group flex flex-col justify-between bg-card-bg border border-card-border rounded-xl overflow-hidden hover:border-neon-purple/40 hover:scale-[1.01] transition-all duration-300 shadow-md"
              >
                <div>
                  <div className="relative w-full h-72 sm:h-80 overflow-hidden">
                    <Image
                      src={getImageUrl(char.featured_image)}
                      alt={char.name}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-w-640px) 100vw, (max-w-1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  </div>

                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neon-purple flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      {role}
                    </span>
                    <h2 className="text-xl font-black text-white group-hover:text-neon-purple transition-colors">
                      {char.name}
                    </h2>
                    <p className="text-xs text-foreground/60 leading-relaxed line-clamp-3">
                      {char.biography.replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/characters/${char.slug}`}
                    className="block text-center w-full py-2.5 rounded-lg bg-background border border-card-border text-xs font-bold hover:bg-neon-purple/5 hover:border-neon-purple/35 hover:text-white text-neon-purple transition-all duration-200"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="border border-dashed border-card-border p-16 text-center rounded-xl bg-card-bg/40">
          <p className="text-foreground/40 text-lg mb-4">No characters registered in the database yet.</p>
          <Link href="/" className="text-neon-purple hover:underline text-sm font-semibold">
            Return Home &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
