import React from "react"
import Link from "next/link"
import Image from "next/image"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Users, ArrowUpRight, ShieldCheck, UserCheck } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import Badge from "@/components/ui/Badge"

export const revalidate = 3600

export const metadata = {
  title: "Meet the Characters | GTA VI Hub",
  description: "Explore dossiers, statistics, voice actors, and deep lore for Lucia, Jason, and the Vice City cast.",
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-10">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge color="magenta" variant="subtle">
            Verified Dossiers
          </Badge>
          <span className="text-xs font-mono text-paper-dim uppercase tracking-widest">
            Leonida Intelligence Division
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-anton uppercase tracking-wider text-white flex items-center gap-3">
          <Users className="w-9 h-9 sm:w-12 sm:h-12 text-[#FF2E88]" />
          Personnel Dossiers
        </h1>
        <p className="text-paper-dim max-w-2xl leading-relaxed text-sm sm:text-base font-sans">
          Classified profiles, tactical backgrounds, affiliations, and verified intelligence records for the protagonists, key allies, and major targets operating in Vice City.
        </p>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-[rgba(245,240,250,0.14)] via-transparent to-transparent" />

      {/* Characters Grid */}
      {characters && characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {characters.map((char, index) => {
            const isFeatured = index === 0
            const stats = (char.stats_json || {}) as Record<string, string>
            const role = stats.role || "Target of Interest"
            const affiliation = stats.affiliation || "Vice City Operative"
            const status = stats.status || "Active"
            const plainBio = char.biography ? char.biography.replace(/<[^>]*>/g, "") : ""

            return (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className={`group relative flex flex-col bg-ink-2 border border-[rgba(245,240,250,0.14)] rounded-2xl overflow-hidden hover:border-[#FF2E88] transition-all duration-300 shadow-xl ${
                  isFeatured ? "md:col-span-2 lg:col-span-2 min-h-[460px]" : "min-h-[420px]"
                }`}
              >
                {/* Full-bleed Portrait Image */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-ink">
                  <Image
                    src={getImageUrl(char.featured_image)}
                    alt={char.name}
                    fill
                    quality={90}
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out opacity-85 group-hover:opacity-100"
                    sizes={
                      isFeatured
                        ? "(max-width: 1024px) 100vw, 66vw"
                        : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    }
                  />

                  {/* Gradient overlays for crisp text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent z-10" />
                </div>

                {/* Top Dossier Badges */}
                <div className="relative z-20 p-6 flex justify-between items-start">
                  <div className="flex flex-wrap gap-2">
                    <Badge color="magenta" variant="filled" className="shadow-md">
                      {role}
                    </Badge>
                    {isFeatured && (
                      <Badge color="yellow" variant="filled" className="shadow-md">
                        FEATURED DOSSIER
                      </Badge>
                    )}
                  </div>
                  <div className="p-2 rounded-full bg-ink/70 border border-[rgba(245,240,250,0.14)] text-paper-dim group-hover:text-white group-hover:border-[#FF2E88] group-hover:bg-[#FF2E88] transition-all duration-300">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>

                {/* Bottom Content & Hover Reveal Teaser */}
                <div className="relative z-20 mt-auto p-6 sm:p-8 space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold tracking-widest text-[#FF8A3D] uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {affiliation} • Status: {status}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-anton uppercase tracking-wide text-white group-hover:text-[#FF2E88] transition-colors">
                      {char.name}
                    </h2>
                  </div>

                  {/* Biography Teaser */}
                  <p className="text-xs sm:text-sm text-paper-dim leading-relaxed line-clamp-2 sm:line-clamp-3 group-hover:text-paper transition-colors">
                    {plainBio}
                  </p>

                  <div className="pt-2 flex items-center gap-2 text-xs font-mono font-bold text-[#FF2E88] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    <span>Inspect Classified Intel</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<UserCheck className="w-12 h-12 text-paper-dim/40 mx-auto" />}
          title="No Personnel Dossiers Cataloged"
          description="The intelligence database currently contains no published character profiles. Stand by for upcoming transmissions."
        />
      )}
    </div>
  )
}
