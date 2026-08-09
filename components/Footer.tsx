import React from "react"
import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-dark border-t border-card-border mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-sm text-foreground/60">
          <div>
            <span className="font-semibold text-foreground/80">GTA VI HUB</span> &copy; {currentYear}. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/about" className="hover:text-neon-pink transition-colors">
              About Us
            </Link>
            <Link href="/privacy" className="hover:text-neon-pink transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-neon-pink transition-colors">
              Contact
            </Link>
          </div>
        </div>
        <div className="text-center mt-6 text-xs text-foreground/40 max-w-2xl mx-auto">
          GTA VI HUB is an unofficial fan site. GTA VI, Grand Theft Auto, Vice City, and all associated logos are trademarks of Take-Two Interactive and Rockstar Games.
        </div>
      </div>
    </footer>
  )
}
