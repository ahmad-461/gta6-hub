import React from "react"
import Link from "next/link"

export const metadata = {
  title: "Tools",
  description: "Advanced interactive fansite tools including heist calculators, weapon customization engines, and stat generators.",
}

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">Interactive Fan Tools</h1>
      <p className="text-foreground/60 mb-8 max-w-2xl">
        Heist preparation calculators, stats analysis panels, and upcoming dynamic map coordinates.
      </p>

      <div className="border border-dashed border-card-border p-12 text-center rounded-lg bg-card-bg/50">
        <p className="text-foreground/40 text-lg mb-4">No tools unlocked yet.</p>
        <Link href="/" className="text-brand-orange hover:underline text-sm font-semibold">
          Return Home &rarr;
        </Link>
      </div>
    </div>
  )
}
