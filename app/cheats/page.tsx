import React from "react"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { ShieldAlert } from "lucide-react"
import CheatsClient from "@/components/CheatsClient"

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
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 sm:w-12 sm:h-12 text-neon-yellow" />
          Cheat Codes Directory
        </h1>
        <p className="text-foreground/60 max-w-2xl leading-relaxed text-sm sm:text-base">
          Unlock standard weapons, weather effects, player enhancements, and unique supercar spawns with our real-time verified inputs for PS5, Xbox, and PC.
        </p>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-card-border/60 via-transparent to-transparent" />

      {/* Interactive Cheats Client Component */}
      <CheatsClient initialCheats={cheats || []} />
    </div>
  )
}
