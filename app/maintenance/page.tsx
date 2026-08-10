import React from "react"
import { Hammer } from "lucide-react"

export const metadata = {
  title: "Under Maintenance | GTA VI Hub",
  description: "We are currently undergoing scheduled maintenance. Please check back later.",
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-neon-pink/10 to-neon-blue/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 border border-card-border bg-card-bg/60 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
        <div className="inline-flex p-4 bg-neon-pink/10 rounded-full text-neon-pink mb-6 animate-pulse">
          <Hammer className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
          System Maintenance
        </h1>

        <p className="text-foreground/70 mb-6 leading-relaxed">
          GTA VI Hub is currently undergoing scheduled maintenance to improve our systems and data flows. We will be back online shortly.
        </p>

        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-card-border to-transparent mb-6" />

        <p className="text-xs text-foreground/40 font-semibold tracking-wider uppercase">
          Thank you for your patience
        </p>
      </div>
    </div>
  )
}
