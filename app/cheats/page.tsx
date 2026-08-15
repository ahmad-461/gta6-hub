import React from "react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ShieldAlert } from "lucide-react"
import CheatsClient from "@/components/CheatsClient"
import Badge from "@/components/ui/Badge"

export const revalidate = 3600

export const metadata = {
  title: "Multi-Platform Cheat Codes | GTA VI Hub",
  description: "Spawn supercars, trigger invincibility, obtain guns, and manipulate weather across PS5, Xbox Series X/S, and PC.",
}

export default async function CheatsPage() {
  const supabase = createSupabaseServerClient()

  // Fetch all cheat codes from Supabase
  const { data: cheats } = await supabase
    .from("cheat_codes")
    .select("id, title, platform, code, category, effect, verified")
    .order("title")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge color="magenta" variant="subtle">
            Bypass Protocols
          </Badge>
          <span className="text-xs font-mono text-paper-dim uppercase tracking-widest">
            Multi-Platform Inputs
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-anton uppercase tracking-wider text-white flex items-center gap-3">
          <ShieldAlert className="w-9 h-9 sm:w-12 sm:h-12 text-[#FF2E88]" />
          Cheat Codes Database
        </h1>
        <p className="text-paper-dim max-w-2xl leading-relaxed text-sm sm:text-base font-sans">
          Unlock standard weapons, weather effects, player invincibility, and vehicle spawns with our verified input sequences for PS5, Xbox, and PC.
        </p>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-[rgba(245,240,250,0.14)] via-transparent to-transparent" />

      {/* Interactive Cheats Client Component */}
      <CheatsClient initialCheats={cheats || []} />
    </div>
  )
}
