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
      <div className="text-neon-pink font-bold uppercase tracking-wider text-sm">
        GTA VI is here!
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center gap-3 sm:gap-6 mt-4">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Mins", value: timeLeft.minutes },
        { label: "Secs", value: timeLeft.seconds },
      ].map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-center bg-background/60 backdrop-blur-md border border-card-border rounded-lg p-2.5 sm:p-4 min-w-[64px] sm:min-w-[80px]"
        >
          <span className="text-xl sm:text-3xl font-extrabold text-neon-pink tabular-nums">
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] sm:text-xs text-foreground/50 uppercase font-bold tracking-wider mt-1">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
