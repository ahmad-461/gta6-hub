import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the GTA 6 Hub editorial and developer teams.",
}

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-neon-pink to-neon-blue bg-clip-text text-transparent">
        Contact Us
      </h1>
      <p className="text-foreground/80 leading-relaxed mb-6">
        Have some feedback, game info, or business inquiries? Fill out the contact form details below or email us directly at support@gta6-hub.example.com. Our editorial staff will review and get back to you shortly.
      </p>

      <form className="space-y-6 max-w-lg bg-card-bg p-8 rounded-lg border border-card-border mt-8">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full bg-background border border-card-border rounded-md px-4 py-2 text-foreground focus:outline-none focus:border-neon-pink transition-all"
            placeholder="Your Name"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full bg-background border border-card-border rounded-md px-4 py-2 text-foreground focus:outline-none focus:border-neon-blue transition-all"
            placeholder="your.email@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-white mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className="w-full bg-background border border-card-border rounded-md px-4 py-2 text-foreground focus:outline-none focus:border-neon-purple transition-all resize-none"
            placeholder="How can we help you?"
            required
          />
        </div>
        <button
          type="button"
          className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white font-bold py-3 rounded-md hover:brightness-110 transition-all duration-200"
        >
          Send Message
        </button>
      </form>
    </div>
  )
}
