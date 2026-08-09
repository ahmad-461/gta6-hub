import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read our privacy guidelines to understand how we store, protect, and process user data.",
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-neon-pink to-neon-blue bg-clip-text text-transparent">
        Privacy Policy
      </h1>
      <p className="text-foreground/80 leading-relaxed mb-6">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <p className="text-foreground/80 leading-relaxed mb-6">
        At GTA VI Hub, accessible from gta6-hub.vercel.app, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by GTA VI Hub and how we use it.
      </p>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
      <p className="text-foreground/80 leading-relaxed mb-6">
        We rely on Supabase for robust user authentication and account creation (email and username). We do not implement or host any third-party advertising cookies or custom trackers.
      </p>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Cookies and Web Beacons</h2>
      <p className="text-foreground/80 leading-relaxed mb-6">
        Like any other website, GTA VI Hub uses cookies to store user preferences and maintain your logged-in session securely using Supabase Auth.
      </p>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Security</h2>
      <p className="text-foreground/80 leading-relaxed mb-6">
        We prioritize your data security. By utilizing secure-by-default enterprise systems like Supabase PostgreSQL and RLS (Row Level Security), your personal account metadata is fully protected.
      </p>
    </div>
  )
}
