import React from "react"
import Link from "next/link"

export const metadata = {
  title: "Cheat Codes",
  description: "Gain invincibility, spawn supercars, obtain unlimited weapons across PS5, Xbox Series X/S, and PC.",
}

export default function CheatsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">Cheat Codes</h1>
      <p className="text-foreground/60 mb-8 max-w-2xl">
        Complete multi-platform inputs for weapons, vehicles, weather controls, and player upgrades.
      </p>

      <div className="border border-dashed border-card-border p-12 text-center rounded-lg bg-card-bg/50">
        <p className="text-foreground/40 text-lg mb-4">No verified cheat codes listed yet.</p>
        <Link href="/" className="text-neon-yellow hover:underline text-sm font-semibold">
          Return Home &rarr;
        </Link>
      </div>
    </div>
  )
}
