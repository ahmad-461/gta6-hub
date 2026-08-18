"use client"

import React, { useState, useEffect } from "react"

interface CountdownTimerProps {
  targetDate: string
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    setIsMounted(true)

    const parseTargetTimestamp = (dateStr: string): number => {
      if (!dateStr) return NaN
      // First try standard Date parsing
      let parsed = Date.parse(dateStr)
      if (!isNaN(parsed)) return parsed

      // Safari fallback: sanitize ISO format strings with timezone offset
      // e.g. "2026-11-19T00:00:00-05:00" -> "2026/11/19 00:00:00 GMT-0500"
      const cleaned = dateStr.replace(/-/g, "/").replace("T", " ")
      parsed = Date.parse(cleaned)
      return parsed
    }

    const calculateTime = () => {
      try {
        const targetMs = parseTargetTimestamp(targetDate)
        const nowMs = Date.now()

        if (isNaN(targetMs)) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
        }

        const difference = targetMs - nowMs
        if (difference <= 0) {
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

  if (!isMounted) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:gap-4 font-mono animate-pulse">
        {["DAYS", "HRS", "MIN", "SEC"].map((label, index) => (
          <div
            key={index}
            className="flex flex-col items-center bg-[#0B0710]/80 border border-[rgba(245,240,250,0.14)] p-2 sm:p-3 rounded"
          >
            <span className="text-xl sm:text-2xl font-bold text-[#FF2E88] tracking-wider tabular-nums">
              --
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#9C8FAE] tracking-widest mt-1">
              {label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (timeLeft.isExpired) {
    return (
      <div className="text-[#FF2E88] font-mono font-bold uppercase tracking-widest text-sm">
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
          className="flex flex-col items-center bg-[#0B0710]/80 border border-[rgba(245,240,250,0.14)] p-2 sm:p-3 rounded"
        >
          <span className="text-xl sm:text-2xl font-bold text-[#FF2E88] tracking-wider tabular-nums">
            {String(item.value).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] text-[#9C8FAE] tracking-widest mt-1">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
