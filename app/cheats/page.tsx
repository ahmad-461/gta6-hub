import React from "react"
import { Shield } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import CheatsContainer from "@/components/CheatsContainer"

export const revalidate = 0 // dynamically server-render

export const metadata = {
  title: "Cheat Codes Database",
  description: "Complete list of multi-platform cheat codes for Grand Theft Auto VI. Gain invincibility, spawn supercars, and get weapons on PS5, Xbox, and PC.",
}

export default async function CheatsPage() {
  const supabase = createSupabaseServerClient()

  let cheatCodes: any[] = []

  try {
    const { data } = await supabase
      .from("cheat_codes")
      .select("id, title, platform, code, category, effect, verified")
      .order("category")
      .order("title")

    cheatCodes = data || []
  } catch (err) {
    console.error("Error loading cheat codes:", err)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow space-y-12">

      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase flex justify-center items-center gap-3">
          <Shield className="w-8 h-8 sm:w-12 sm:h-12 text-neon-yellow animate-pulse" />
          <span>Cheat Codes <span className="bg-gradient-to-r from-neon-yellow to-brand-orange bg-clip-text text-transparent">Database</span></span>
        </h1>
        <p className="text-foreground/60 text-sm sm:text-base leading-relaxed">
          Unlock vehicles, upgrade players, and modify Vice City mechanics using verified cheat code keys.
        </p>
      </div>

      {/* DETAILED INTERACTIVE CONTAINER */}
      <CheatsContainer initialCodes={cheatCodes} />

    </div>
  )
}
