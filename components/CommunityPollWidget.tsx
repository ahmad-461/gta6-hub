"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Vote, CheckCircle2 } from "lucide-react"

interface Poll {
  id: string
  question: string
  options_json: string[]
  votes_json: Record<string, number>
}

interface CommunityPollWidgetProps {
  initialPoll: Poll
}

export default function CommunityPollWidget({ initialPoll }: CommunityPollWidgetProps) {
  const [poll, setPoll] = useState<Poll>(initialPoll)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Check if user has already voted
    const votedPolls = JSON.parse(localStorage.getItem("voted_polls") || "[]") as string[]
    if (votedPolls.includes(poll.id)) {
      setHasVoted(true)
    }
  }, [poll.id])

  const totalVotes = Object.values(poll.votes_json || {}).reduce((sum, val) => sum + (val || 0), 0)

  const handleVote = async (option: string) => {
    if (hasVoted || submitting) return
    setSelectedOption(option)
    setSubmitting(true)

    try {
      const currentVotes = poll.votes_json || {}
      const updatedVotes = {
        ...currentVotes,
        [option]: (currentVotes[option] || 0) + 1,
      }

      // Perform update to Supabase
      const { error } = await supabase
        .from("polls")
        .update({ votes_json: updatedVotes })
        .eq("id", poll.id)

      if (error) {
        console.error("Failed to register vote:", error)
        alert("Could not register your vote. Please try again.")
        setSubmitting(false)
        return
      }

      // Update state
      setPoll((prev) => ({
        ...prev,
        votes_json: updatedVotes,
      }))

      // Save in localStorage
      const votedPolls = JSON.parse(localStorage.getItem("voted_polls") || "[]") as string[]
      votedPolls.push(poll.id)
      localStorage.setItem("voted_polls", JSON.stringify(votedPolls))

      setHasVoted(true)
    } catch (err) {
      console.error("Failed to vote:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-2 mb-4 text-neon-pink">
        <Vote className="w-5 h-5" />
        <h3 className="font-extrabold text-lg text-white uppercase tracking-wider">
          Community Poll
        </h3>
      </div>

      <p className="text-white font-bold mb-4 leading-snug">
        {poll.question}
      </p>

      {hasVoted ? (
        <div className="space-y-3">
          {poll.options_json.map((option) => {
            const votes = poll.votes_json?.[option] || 0
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
            return (
              <div key={option} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-foreground/80">
                  <span className="flex items-center gap-1.5">
                    {option}
                    {selectedOption === option && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-neon-blue inline" />
                    )}
                  </span>
                  <span>
                    {votes} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-background border border-card-border rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-neon-pink to-neon-blue h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
          <div className="text-right text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-4">
            Total Votes: {totalVotes}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {poll.options_json.map((option) => (
            <button
              key={option}
              onClick={() => handleVote(option)}
              disabled={submitting}
              className="w-full text-left px-4 py-2.5 rounded-lg border border-card-border bg-background hover:border-neon-pink hover:bg-neon-pink/5 text-sm font-medium text-foreground/90 hover:text-white transition-all duration-200 flex items-center justify-between group"
            >
              <span>{option}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 group-hover:bg-neon-pink transition-all duration-200" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
