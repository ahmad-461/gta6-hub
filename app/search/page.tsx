import React from "react"
import SearchClient from "@/components/SearchClient"
import { Search } from "lucide-react"

export const metadata = {
  title: "Search Database | GTA VI Hub",
  description: "Search across all articles, mission walkthroughs, character lore, and cheat codes on GTA VI Hub.",
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Page Header */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white flex items-center justify-center gap-2">
          <Search className="w-8 h-8 sm:w-12 sm:h-12 text-neon-pink" />
          Hub Search
        </h1>
        <p className="text-foreground/60 leading-relaxed text-sm sm:text-base">
          Full-text index lookup across standard articles, guides, and character profiles.
        </p>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-card-border/60 to-transparent" />

      {/* Search Client Component */}
      <SearchClient />
    </div>
  )
}
