"use client"

import React, { useState, useEffect } from "react"

interface CountdownTimerProps {
  targetDateString: string
}

export default function CountdownTimer({ targetDateString }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    const target = new Date(targetDateString).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [targetDateString])

  if (!timeLeft) {
    return (
      <div className="flex justify-center space-x-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card-bg/80 border border-card-border p-4 rounded-lg w-20">
            <div className="h-8 bg-foreground/10 rounded mb-2"></div>
            <div className="h-4 bg-foreground/5 rounded w-12 mx-auto"></div>
          </div>
        ))}
      </div>
    )
  }

  const timeBlocks = [
    { label: "DAYS", value: timeLeft.days, color: "text-neon-pink shadow-neon-pink/25" },
    { label: "HOURS", value: timeLeft.hours, color: "text-neon-purple shadow-neon-purple/25" },
    { label: "MINS", value: timeLeft.minutes, color: "text-neon-blue shadow-neon-blue/25" },
    { label: "SECS", value: timeLeft.seconds, color: "text-neon-yellow shadow-neon-yellow/25" },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {timeBlocks.map((block) => (
        <div
          key={block.label}
          className="bg-card-bg/90 border border-card-border px-4 py-3 rounded-lg w-24 text-center shadow-lg hover:border-foreground/20 transition-all duration-300"
        >
          <div className={`text-3xl font-extrabold tracking-tight ${block.color}`}>
            {String(block.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] tracking-widest text-foreground/50 font-bold mt-1">
            {block.label}
          </div>
        </div>
      ))}
    </div>
  )
}
