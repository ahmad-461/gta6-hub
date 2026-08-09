"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  CheckSquare,
  Square,
  RotateCcw,
  Award,
  ArrowLeft,
  Flame,
  CheckCircle,
  Clock
} from "lucide-react"

interface Mission {
  id: string
  title: string
  type: string
  duration: string
  description: string
}

const STORY_MISSIONS: Mission[] = [
  {
    id: "prologue",
    title: "Prologue",
    type: "Introduction",
    duration: "10 mins",
    description: "Introduces the core dual-protagonist criminal mechanics, switching systems, and a dramatic opening shootout."
  },
  {
    id: "first-contact",
    title: "First Contact",
    type: "Story Mission",
    duration: "15 mins",
    description: "Lucia and Jason team up for their first small-scale coordinate robbery at an Everglades gas station."
  },
  {
    id: "the-setup",
    title: "The Setup",
    type: "Heist Prep",
    duration: "25 mins",
    description: "Scout security cameras and hijack a heavy smuggling boat from the industrial docks."
  },
  {
    id: "vice-city-streets",
    title: "Vice City Streets",
    type: "Story Mission",
    duration: "20 mins",
    description: "Outrun the Port Gellhorn police squads in a high-speed pursuit through dense urban traffic."
  },
  {
    id: "the-heist",
    title: "The Heist",
    type: "Heist Finale",
    duration: "40 mins",
    description: "Execute your first major bank robbery in Vice City. Breach the vault, secure the cash, and hold off SWAT."
  },
  {
    id: "escape-route",
    title: "Escape Route",
    type: "Story Mission",
    duration: "15 mins",
    description: "Clear out loose ends, dispose of the getaway vehicle, and split the take at your hidden safehouse."
  },
  {
    id: "leonida-highway",
    title: "Leonida Highway",
    type: "Story Mission",
    duration: "30 mins",
    description: "Smuggle contraband goods across the state highway patrol roadblocks into the Florida Keys."
  },
  {
    id: "the-reveal",
    title: "The Reveal",
    type: "Story Mission",
    duration: "25 mins",
    description: "Investigate and neutralize a suspected undercover informant operating inside your smuggling crew."
  },
  {
    id: "endgame-prep",
    title: "Endgame Prep",
    type: "Heist Prep",
    duration: "35 mins",
    description: "Steal military-grade heavy gear, hack traffic signals, and obtain a high-altitude helicopter."
  },
  {
    id: "finale",
    title: "Finale",
    type: "Heist Finale",
    duration: "50 mins",
    description: "The ultimate Leonida Union heist. Infiltrate the state reserve, secure $50M+, and choose your ending."
  }
]

export default function MissionTrackerPage() {
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  // Load from localStorage on mount (prevents hydration mismatch)
  useEffect(() => {
    setIsMounted(true)
    try {
      const stored = localStorage.getItem("gta6_completed_missions")
      if (stored) {
        setCompletedIds(JSON.parse(stored))
      }
    } catch (err) {
      console.warn("Failed to read completed missions from localStorage:", err)
    }
  }, [])

  // Persist to localStorage whenever completed list changes
  const saveCompleted = (updated: string[]) => {
    setCompletedIds(updated)
    try {
      localStorage.setItem("gta6_completed_missions", JSON.stringify(updated))
    } catch (err) {
      console.warn("Failed to write completed missions to localStorage:", err)
    }
  }

  const toggleMission = (id: string) => {
    if (completedIds.includes(id)) {
      saveCompleted(completedIds.filter((mid) => mid !== id))
    } else {
      saveCompleted([...completedIds, id])
    }
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all mission completion progress?")) {
      saveCompleted([])
    }
  }

  const handleMarkAll = () => {
    saveCompleted(STORY_MISSIONS.map((m) => m.id))
  }

  const completedCount = completedIds.length
  const totalCount = STORY_MISSIONS.length
  const progressPercent = Math.round((completedCount / totalCount) * 100) || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href="/tools"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-neon-blue hover:text-neon-pink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tools</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8 gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <CheckSquare className="w-8 h-8 text-neon-pink animate-pulse" />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              GTA 6 Story Mission Tracker
            </h1>
          </div>
          <p className="text-foreground/60 max-w-2xl">
            Stay organized as you conquer the speculative campaign of Leonida. Check off story chapters, keep track of average durations, and monitor your overall story completion percentage.
          </p>
        </div>

        {/* Global Progress Card */}
        {isMounted && (
          <div className="bg-card-bg/60 border border-card-border p-5 rounded-xl shrink-0 w-full lg:w-80 backdrop-blur-sm shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider">
                Overall Progress
              </span>
              <span className="text-sm font-black text-white">
                {completedCount} / {totalCount} Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/5 h-3.5 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs font-bold">
              <span className={`${progressPercent === 100 ? "text-neon-yellow" : "text-neon-pink"}`}>
                {progressPercent}% Complete
              </span>
              {progressPercent === 100 && (
                <span className="flex items-center space-x-1 text-neon-yellow">
                  <Award className="w-4 h-4" />
                  <span>100% Gold Club!</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <span className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">
          Campaign Checklist (10 spec-ops missions)
        </span>

        <div className="flex space-x-3">
          <button
            onClick={handleMarkAll}
            className="text-xs font-bold text-neon-blue hover:underline flex items-center space-x-1"
          >
            <span>Mark All Completed</span>
          </button>
          <span className="text-foreground/20">|</span>
          <button
            onClick={handleReset}
            disabled={completedCount === 0}
            className="text-xs font-bold text-red-400 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="space-y-3.5">
        {STORY_MISSIONS.map((mission, index) => {
          const isCompleted = isMounted && completedIds.includes(mission.id)
          return (
            <div
              key={mission.id}
              onClick={() => toggleMission(mission.id)}
              className={`border p-4 sm:p-5 rounded-xl cursor-pointer transition-all duration-200 select-none flex items-start space-x-4 ${
                isCompleted
                  ? "bg-neon-pink/[0.02] border-neon-pink/40 shadow-md shadow-neon-pink/[0.02]"
                  : "bg-card-bg/50 border-card-border hover:border-white/10 hover:bg-card-bg"
              }`}
            >
              {/* Checkbox Icon */}
              <div className="shrink-0 mt-1">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-neon-pink animate-scale" />
                ) : (
                  <Square className="w-6 h-6 text-foreground/20 hover:text-foreground/40" />
                )}
              </div>

              {/* Description */}
              <div className="flex-grow min-w-0 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-xs font-bold text-foreground/30 font-mono">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className={`text-base font-extrabold truncate ${isCompleted ? "text-neon-pink line-through" : "text-white"}`}>
                      {mission.title}
                    </h3>
                    <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded bg-white/5 text-foreground/40 uppercase">
                      {mission.type}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs text-foreground/40 font-semibold shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{mission.duration}</span>
                  </div>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${isCompleted ? "text-foreground/30" : "text-foreground/60"}`}>
                  {mission.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Interactive sticky prompt */}
      <div className="mt-12 p-6 rounded-xl border border-dashed border-card-border/80 bg-card-bg/20 text-center max-w-xl mx-auto space-y-2">
        <Flame className="w-6 h-6 text-neon-yellow mx-auto animate-pulse" />
        <h4 className="text-sm font-extrabold text-white uppercase">Client-Side Persistence</h4>
        <p className="text-xs text-foreground/50 leading-relaxed">
          Your campaign progress is saved automatically inside your browser&apos;s localStorage cache. You can close this tab or restart your browser, and your checklist will remain intact without needing to register or log in.
        </p>
      </div>
    </div>
  )
}
