import React from "react"
import Link from "next/link"

export const metadata = {
  title: "Characters",
  description: "Explore backgrounds, custom statistics, voice actors, and lore for Jason, Lucia, and the Vice City cast.",
}

export default function CharactersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">Characters</h1>
      <p className="text-foreground/60 mb-8 max-w-2xl">
        Meet Lucia, Jason, and the core players operating across the state of Leonida.
      </p>

      <div className="border border-dashed border-card-border p-12 text-center rounded-lg bg-card-bg/50">
        <p className="text-foreground/40 text-lg mb-4">No character profiles registered yet.</p>
        <Link href="/" className="text-neon-purple hover:underline text-sm font-semibold">
          Return Home &rarr;
        </Link>
      </div>
    </div>
  )
}
