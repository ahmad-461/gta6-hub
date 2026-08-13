"use client"

import React, { useState, useEffect } from "react"

interface CountdownTimerProps {
  targetDate: string
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    const calculateTime = () => {
      try {
        const difference = +new Date(targetDate) - +new Date()
        if (isNaN(difference) || difference <= 0) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
        }

        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          isExpired: false,
        }
      } catch (e) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
      }
    }

    setTimeLeft(calculateTime())

    const interval = setInterval(() => {
      setTimeLeft(calculateTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  if (timeLeft.isExpired) {
    return (
      <div className="text-magenta font-mono font-bold uppercase tracking-widest text-sm">
        GTA VI IS NOW ACTIVE
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 font-mono">
      {[
        { label: "DAYS", value: timeLeft.days },
        { label: "HRS", value: timeLeft.hours },
        { label: "MIN", value: timeLeft.minutes },
        { label: "SEC", value: timeLeft.seconds },
      ].map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-center bg-ink/80 border border-[rgba(245,240,250,0.14)] p-2 sm:p-3 rounded"
        >
          <span className="text-xl sm:text-2xl font-bold text-magenta tracking-wider tabular-nums">
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-paper-dim tracking-widest mt-1">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
