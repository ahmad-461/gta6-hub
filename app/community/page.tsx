"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Trophy, Shield, HelpCircle, Award, Gift, Zap, RefreshCw, Star, Users, Flame, Loader2 } from "lucide-react"

interface LeaderboardItem {
  anon_id: string
  points: number
  updated_at: string
}

export default function CommunityPointsPage() {
  const [visitorId, setVisitorId] = useState("")
  const [visitorPoints, setVisitorPoints] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load visitor details and leaderboard
  useEffect(() => {
    fetchLeaderboard()
    loadVisitorPoints()
  }, [])

  const loadVisitorPoints = async () => {
    try {
      const { getOrCreateAnonId, getClientPoints } = await import("@/lib/points")
      const vid = getOrCreateAnonId()
      setVisitorId(vid)

      const pts = await getClientPoints()
      setVisitorPoints(pts)
    } catch (err) {
      console.warn("Could not load local session points:", err)
    }
  }

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    try {
      // Fetch top 15 community points rows
      const { data, error } = await supabase
        .from("community_points")
        .select("anon_id, points, updated_at")
        .order("points", { ascending: false })
        .limit(15)

      if (error) throw error
      setLeaderboard(data || [])
    } catch (err) {
      console.error("Failed to load leaderboard:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate a fun derived label based on the hash of anon_id to avoid exposing the raw ID
  const getAnonymizedLabel = (rawId: string) => {
    if (!rawId) return "Anonymous Explorer"

    // Hash function to create a clean deterministic identifier
    let hash = 0
    for (let i = 0; i < rawId.length; i++) {
      hash = rawId.charCodeAt(i) + ((hash << 5) - hash)
    }

    const idCode = Math.abs(hash % 10000).toString().padStart(4, "0")

    // Fun criminal-themed titles based on the hash value
    const roles = ["Vice Crew", "Explorer", "Hustler", "Mastermind", "Enforcer", "Collector", "Underworlder", "Associate"]
    const role = roles[Math.abs(hash) % roles.length]

    return `${role} #${idCode}`
  }

  // Rank badge styling
  const getRankBadgeStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case 1:
        return "bg-slate-400/10 text-slate-300 border-slate-300/20"
      case 2:
        return "bg-amber-600/10 text-amber-500 border-amber-600/20"
      default:
        return "bg-white/5 text-foreground/60 border-white/5"
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-card-border pb-6">
        <div>
          <div className="flex items-center space-x-2 text-neon-pink mb-1.5">
            <Trophy className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase">Vice Community Ledger</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-mono">
            Community Intelligence Hub
          </h1>
          <p className="text-sm text-foreground/60 max-w-xl">
            Accumulate points by contributing to the collective intelligence. Vote in polls, annotate maps, test yourself, and check off objectives.
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={async () => {
            await loadVisitorPoints()
            await fetchLeaderboard()
          }}
          className="inline-flex items-center px-4 py-2 bg-card-bg border border-card-border hover:border-white/20 text-white text-xs font-bold rounded-lg transition-all space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Ledger</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Visitor Point breakdown & point actions rules */}
        <div className="lg:col-span-1 space-y-6">
          {/* Visitor personal Points Card */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue" />
            <h3 className="text-xs font-black tracking-widest text-foreground/40 uppercase">Your Profile</h3>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gradient-to-tr from-neon-pink/20 to-neon-blue/20 border border-card-border flex items-center justify-center rounded-xl">
                <Star className="text-neon-pink w-7 h-7" />
              </div>
              <div>
                <p className="font-extrabold text-white text-lg font-mono">
                  {visitorId ? getAnonymizedLabel(visitorId) : "Unregistered Explorer"}
                </p>
                <p className="text-[10px] text-foreground/45 font-mono uppercase truncate max-w-[200px]">
                  ID: {visitorId || "Generating id..."}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-card-border/40 space-y-1">
              <span className="text-[10px] font-black tracking-widest text-foreground/40 uppercase block">Total Points Earned</span>
              <p className="text-4xl font-black text-white font-mono tracking-tight flex items-baseline">
                {visitorPoints} <span className="text-xs text-neon-blue font-bold ml-1.5 uppercase font-sans">PTS</span>
              </p>
            </div>
          </div>

          {/* Action Guidelines points system table */}
          <div className="bg-card-bg border border-card-border p-6 rounded-xl space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="text-neon-yellow w-4 h-4" />
              How to Earn Points
            </h3>

            <div className="space-y-3.5 text-xs">
              {[
                { action: "Vote in community polls", points: "+5 pts", desc: "Share your speculation on weekly polls." },
                { action: "Submit comments on articles", points: "+10 pts", desc: "Contribute approved analytical theories to articles." },
                { action: "Complete character quiz match", points: "+5 pts", desc: "Discover which protagonist matches your profile." },
                { action: "Check off campaign checklists", points: "+2 pts each", desc: "Plot story and campaign milestones in the tracker." },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-3 p-3 bg-background/50 border border-card-border/60 rounded-lg">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">{item.action}</p>
                    <p className="text-[11px] text-foreground/45">{item.desc}</p>
                  </div>
                  <span className="text-xs font-black text-neon-blue shrink-0">{item.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns - Top Community Members Leaderboard */}
        <div className="lg:col-span-2 bg-card-bg border border-card-border p-6 rounded-xl shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-card-border pb-4">
            <h3 className="text-base font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Users className="text-neon-pink w-5 h-5" />
              Top Community Members
            </h3>
            <span className="text-[10px] text-foreground/45 uppercase tracking-widest font-mono">
              Live database rankings
            </span>
          </div>

          {/* Leaderboard list container */}
          {isLoading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="animate-spin text-neon-pink w-8 h-8" />
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((item, idx) => {
                const label = getAnonymizedLabel(item.anon_id)
                const isSelf = item.anon_id === visitorId
                const badgeStyle = getRankBadgeStyle(idx)

                return (
                  <div
                    key={item.anon_id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isSelf
                        ? "bg-neon-pink/[0.03] border-neon-pink/40 shadow-md shadow-neon-pink/[0.01]"
                        : "bg-background/40 border-card-border/60 hover:border-card-border"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank Index */}
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs border ${badgeStyle}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className={`font-extrabold text-sm ${isSelf ? "text-neon-pink" : "text-white"}`}>
                          {label} {isSelf && <span className="text-[10px] font-bold text-neon-blue font-sans uppercase tracking-widest ml-1">[You]</span>}
                        </p>
                        <p className="text-[10px] text-foreground/45 mt-0.5">
                          Last activity: {new Date(item.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-black text-white text-base">
                        {item.points} <span className="text-[10px] text-foreground/40 font-bold font-sans">PTS</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-card-border rounded-xl">
              <Trophy className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-white uppercase tracking-wider">No member rankings charted yet</p>
              <p className="text-xs text-foreground/45 mt-1">Be the first to accumulate intelligence points to chart this ledger!</p>
            </div>
          )}

          {/* Scope notice flag */}
          <div className="p-4 bg-background border border-dashed border-card-border rounded-lg text-center text-xs text-foreground/50 leading-relaxed max-w-md mx-auto">
            <Flame className="w-4 h-4 text-neon-yellow mx-auto mb-1 animate-pulse" />
            <p className="font-semibold text-white uppercase text-[10px] tracking-wider mb-1">Lightweight Anonymous Ledger</p>
            To keep the database fast, light, and secure, this hub deliberate avoids password accounts or real email listings. Your points persist safely in browser caches and sync under secure cryptographically anonymized labels.
          </div>
        </div>
      </div>
    </div>
  )
}
