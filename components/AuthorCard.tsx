"use client"

import React, { useState } from "react"
import Link from "next/link"
import { User, Github, Linkedin, Mail, ExternalLink, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react"

interface AuthorCardProps {
  compact?: boolean
  className?: string
}

export default function AuthorCard({ compact = false, className = "" }: AuthorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const author = {
    name: "Ahmad Khan",
    role: "Founder & Editor",
    bio: "Lead editor and founder of GTA 6 Hub. Dedicated to delivering verified, database-first coverage and raw telemetry for Grand Theft Auto VI.",
    fullBio: "Ahmad Khan is the founder and editor-in-chief of GTA 6 Hub. Following the Grand Theft Auto series closely and specializing in full-stack web architectures, Ahmad built GTA 6 Hub to provide independent, high-fidelity coverage, interactive state maps, and declassified trailer analyses free from corporate sanitization.",
    github: "https://github.com/ahmad-461",
    linkedin: "https://www.linkedin.com/in/ahmad-khan-77441833a",
    email: "mailto:ahmad.khan8747763@gmail.com",
  }

  if (compact) {
    return (
      <div className={`p-4 rounded-xl bg-ink-2/80 border border-card-border/80 text-xs ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF2E88]/20 to-[#00E5FF]/20 border border-[#00E5FF]/30 flex items-center justify-center font-bold font-mono text-[#00E5FF]">
              AK
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-white">{author.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF8A3D]/10 text-[#FF8A3D] font-mono border border-[#FF8A3D]/30">
                  {author.role}
                </span>
              </div>
              <p className="text-[11px] text-paper-dim/70 line-clamp-1">{author.bio}</p>
            </div>
          </div>
          <Link
            href="/author"
            className="text-[11px] font-mono font-bold text-[#00E5FF] hover:text-[#FF2E88] transition-colors flex items-center space-x-1"
          >
            <span>Profile</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 rounded-xl bg-[#150C1F] border border-[rgba(245,240,250,0.14)] shadow-xl relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00E5FF]/10 to-transparent blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[rgba(245,240,250,0.08)] pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF2E88]/30 via-purple-600/20 to-[#00E5FF]/30 border-2 border-[#00E5FF]/40 flex items-center justify-center font-anton text-xl text-white shadow-md flex-shrink-0">
            AK
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-lg font-anton uppercase text-[#F5F0FA] tracking-wide">
                {author.name}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FF2E88]/15 text-[#FF2E88] border border-[#FF2E88]/30">
                <ShieldCheck className="w-3 h-3 mr-1" /> {author.role}
              </span>
            </div>
            <p className="text-xs text-[#9C8FAE] font-mono mt-0.5">
              Independent Researcher & Lead Editor
            </p>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex items-center space-x-3 font-mono text-xs">
          <a
            href={author.github}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-[#0B0710] border border-[rgba(245,240,250,0.12)] text-[#9C8FAE] hover:text-[#00E5FF] hover:border-[#00E5FF]/50 transition-all"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href={author.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-[#0B0710] border border-[rgba(245,240,250,0.12)] text-[#9C8FAE] hover:text-[#00E5FF] hover:border-[#00E5FF]/50 transition-all"
            title="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href={author.email}
            className="p-2 rounded-lg bg-[#0B0710] border border-[rgba(245,240,250,0.12)] text-[#9C8FAE] hover:text-[#00E5FF] hover:border-[#00E5FF]/50 transition-all"
            title="Email"
          >
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <p className="text-xs sm:text-sm text-[#9C8FAE] leading-relaxed">
          {isExpanded ? author.fullBio : author.bio}
        </p>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-mono font-bold text-[#FF8A3D] hover:text-[#FF2E88] transition-colors flex items-center space-x-1"
          >
            <span>{isExpanded ? "Show Less" : "Read Full Bio"}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <Link
            href="/author"
            className="text-[11px] font-mono font-bold text-[#00E5FF] hover:underline flex items-center space-x-1"
          >
            <span>View Author Dossier & Articles</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
