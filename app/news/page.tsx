import React from "react"
import Link from "next/link"

export const metadata = {
  title: "News",
  description: "Stay updated with standard breaking news, leaks, rumors, and announcements of Grand Theft Auto VI.",
}

export default function NewsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">Latest News</h1>
      <p className="text-foreground/60 mb-8 max-w-2xl">
        All standard announcements, community updates, and game system reviews are loaded dynamically from Supabase.
      </p>

      <div className="border border-dashed border-card-border p-12 text-center rounded-lg bg-card-bg/50">
        <p className="text-foreground/40 text-lg mb-4">No articles published yet.</p>
        <Link href="/" className="text-neon-pink hover:underline text-sm font-semibold">
          Return Home &rarr;
        </Link>
      </div>
    </div>
  )
}
