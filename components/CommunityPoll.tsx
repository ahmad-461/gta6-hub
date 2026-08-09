"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface Poll {
  id: string
  question: string
  options_json: string[]
  votes_json: Record<string, number>
  active: boolean
}

interface CommunityPollProps {
  initialPoll: Poll
}

export default function CommunityPoll({ initialPoll }: CommunityPollProps) {
  const [poll, setPoll] = useState<Poll>(initialPoll)
  const [voted, setVoted] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVote = localStorage.getItem(`gta6_poll_voted_${initialPoll.id}`)
      if (savedVote) {
        setVoted(true)
        setSelected(savedVote)
      }
    }
  }, [initialPoll.id])

  // Optional: Poll real-time updates or just fetch on component mount
  const handleVote = async (option: string) => {
    if (submitting || voted) return
    setSubmitting(true)

    try {
      // 1. Fetch current votes from Supabase to prevent race conditions
      const { data, error: fetchError } = await supabase
        .from("polls")
        .select("votes_json")
        .eq("id", poll.id)
        .single()

      if (fetchError) throw fetchError

      const currentVotes = (data?.votes_json || {}) as Record<string, number>
      const newVotes = {
        ...currentVotes,
        [option]: (currentVotes[option] || 0) + 1,
      }

      // 2. Update votes in Supabase
      const { error: updateError } = await supabase
        .from("polls")
        .update({ votes_json: newVotes })
        .eq("id", poll.id)

      if (updateError) throw updateError

      // 3. Save to state and localStorage
      localStorage.setItem(`gta6_poll_voted_${poll.id}`, option)
      setPoll((prev) => ({ ...prev, votes_json: newVotes }))
      setSelected(option)
      setVoted(true)
    } catch (err) {
      console.error("Error voting:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const options = poll.options_json || []
  const votes = poll.votes_json || {}
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0)

  return (
    <div className="bg-card-bg border border-card-border rounded-lg p-6 hover:border-neon-pink/30 transition-all duration-300">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-neon-pink animate-pulse" />
        Community Poll
      </h3>
      <p className="text-sm text-foreground/80 font-semibold mb-6">{poll.question}</p>

      <div className="space-y-4">
        {options.map((option) => {
          const voteCount = votes[option] || 0
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0

          return (
            <div key={option} className="relative">
              {voted ? (
                <div className="w-full bg-background border border-card-border rounded-md p-3 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-neon-pink/10 border-r border-neon-pink/30 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative z-10 flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground flex items-center gap-2">
                      {option}
                      {selected === option && (
                        <span className="text-[10px] bg-neon-pink text-white px-1.5 py-0.5 rounded font-bold">
                          YOUR VOTE
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-neon-pink">{percentage}%</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleVote(option)}
                  disabled={submitting}
                  className="w-full bg-background hover:bg-neon-pink/5 border border-card-border hover:border-neon-pink text-left text-sm text-foreground/80 hover:text-white p-3 rounded-md font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {option}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {voted && (
        <div className="text-right text-[11px] text-foreground/40 font-bold mt-4 tracking-wider">
          TOTAL VOTES: {totalVotes}
        </div>
      )}
    </div>
  )
}
