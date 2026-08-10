"use client"

import React, { useState, useEffect } from "react"

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY

      if (documentHeight > windowHeight) {
        const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100
        setProgress(scrollPercent)
      } else {
        setProgress(0)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="fixed top-16 left-0 w-full h-[3.5px] bg-transparent z-50 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
