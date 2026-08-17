"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Github, Linkedin, Twitter, Youtube, Disc } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await supabase.from("site_settings").select("key, value")
        if (data) {
          const mapped = data.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
          }, {} as Record<string, string>)
          setSettings(mapped)
        }
      } catch (e) {
        console.error("Error loading settings in footer:", e)
      }
    }
    fetchSettings()
  }, [])

  // Check which settings are present
  const twitterUrl = settings["social_twitter"] || ""
  const redditUrl = settings["social_reddit"] || ""
  const discordUrl = settings["social_discord"] || ""
  const youtubeUrl = settings["social_youtube"] || ""

  const hasTwitter = !!twitterUrl
  const hasDiscord = !!discordUrl
  const hasYoutube = !!youtubeUrl

  const navLinks = [
    { name: "News", href: "/news" },
    { name: "Characters", href: "/characters" },
    { name: "Map", href: "/map" },
    { name: "Cheats", href: "/cheats" },
    { name: "Tools", href: "/tools" },
  ]

  const legalLinks = [
    { name: "About Us", href: "/about" },
    { name: "FAQ", href: "/faq" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <footer className="relative bg-[#150C1F] border-t border-[rgba(245,240,250,0.14)] mt-auto pt-16 pb-8 overflow-hidden font-mono">
      {/* Film grain pattern matching the homepage */}
      <div className="film-grain opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 xl:gap-12 pb-12 border-b border-[rgba(245,240,250,0.14)]">
          {/* Column 1: Logo & Tagline */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]"></span>
              </span>
              <span className="text-xl font-normal tracking-wider text-[#F5F0FA] font-anton uppercase">
                GTA6<span className="text-[#FF2E88]">HUB</span>
              </span>
            </Link>
            <p className="text-xs text-[#9C8FAE] leading-relaxed max-w-sm">
              The ultimate unofficial resource and community hub for Grand Theft Auto VI.
            </p>
            <div className="text-[10px] text-[#9C8FAE]/60 uppercase tracking-widest font-mono pt-2">
              BUILD. SHIP. ITERATE.
            </div>
          </div>

          {/* Column 2: Site Navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#F5F0FA] uppercase tracking-widest border-b border-[rgba(245,240,250,0.08)] pb-2">
              Navigation
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="relative text-[#9C8FAE] hover:text-white transition-colors py-1 group block"
                  >
                    <span>{link.name}</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#FF2E88] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Affiliate */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#F5F0FA] uppercase tracking-widest border-b border-[rgba(245,240,250,0.08)] pb-2">
              Information
            </h4>
            <ul className="space-y-2.5 text-xs">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="relative text-[#9C8FAE] hover:text-white transition-colors py-1 group inline-block"
                  >
                    <span>{link.name}</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#FF2E88] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-[#9C8FAE]/60 leading-relaxed italic pt-2 border-t border-[rgba(245,240,250,0.08)]">
              Disclosure: This page contains affiliate links. If you make a purchase through them, we may earn a small commission at no extra cost to you.
            </p>
          </div>

          {/* Column 4: Connect */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#F5F0FA] uppercase tracking-widest border-b border-[rgba(245,240,250,0.08)] pb-2">
              Connect
            </h4>
            <ul className="space-y-2.5 text-xs">
              {/* GitHub */}
              <li>
                <a
                  href="https://github.com/ahmad-461"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center space-x-2 text-[#9C8FAE] hover:text-white transition-colors py-1 group inline-flex"
                >
                  <Github className="w-4 h-4 text-[#00E5FF]" />
                  <span>GitHub</span>
                  <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#FF2E88] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                </a>
              </li>
              {/* LinkedIn */}
              <li>
                <a
                  href="https://www.linkedin.com/in/ahmad-khan-77441833a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center space-x-2 text-[#9C8FAE] hover:text-white transition-colors py-1 group inline-flex"
                >
                  <Linkedin className="w-4 h-4 text-[#00E5FF]" />
                  <span>LinkedIn</span>
                  <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#FF2E88] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                </a>
              </li>
              {/* Conditional Site Settings Socials */}
              {hasTwitter && (
                <li>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center space-x-2 text-[#9C8FAE] hover:text-white transition-colors py-1 group inline-flex"
                  >
                    <Twitter className="w-4 h-4 text-[#00E5FF]" />
                    <span>Twitter / X</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#FF2E88] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </a>
                </li>
              )}
              {hasYoutube && (
                <li>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center space-x-2 text-[#9C8FAE] hover:text-white transition-colors py-1 group inline-flex"
                  >
                    <Youtube className="w-4 h-4 text-[#00E5FF]" />
                    <span>YouTube</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#FF2E88] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </a>
                </li>
              )}
              {hasDiscord && (
                <li>
                  <a
                    href={discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center space-x-2 text-[#9C8FAE] hover:text-white transition-colors py-1 group inline-flex"
                  >
                    <Disc className="w-4 h-4 text-[#00E5FF]" />
                    <span>Discord</span>
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#FF2E88] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Sub-row */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-[11px] text-[#9C8FAE]/50 space-y-3 sm:space-y-0">
          <div>
            <span>&copy; {currentYear} GTA6 HUB. All rights reserved.</span>
          </div>
          <div className="text-center sm:text-right">
            <span>Fan-made, unofficial project. Grand Theft Auto, Vice City, Rockstar Games are trademarks of Take-Two Interactive.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
