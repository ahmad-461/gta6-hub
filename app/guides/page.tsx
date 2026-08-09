import React from "react"
import Link from "next/link"

export const metadata = {
  title: "Guides",
  description: "Walkthroughs, collectibles search, heists strategies, and expert gameplay optimization guides.",
}

export default function GuidesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">Walkthroughs & Guides</h1>
      <p className="text-foreground/60 mb-8 max-w-2xl">
        Expert heist guides, interactive weapon modules, and multi-layered collectible search pointers.
      </p>

      <div className="border border-dashed border-card-border p-12 text-center rounded-lg bg-card-bg/50">
        <p className="text-foreground/40 text-lg mb-4">No guides published yet.</p>
        <Link href="/" className="text-neon-blue hover:underline text-sm font-semibold">
          Return Home &rarr;
        </Link>
      </div>
    </div>
  )
}
