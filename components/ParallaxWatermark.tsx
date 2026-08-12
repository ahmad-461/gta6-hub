"use client"

import React, { useState, useEffect } from "react"

interface ParallaxWatermarkProps {
  text: string
  className?: string
}

export default function ParallaxWatermark({ text, className = "" }: ParallaxWatermarkProps) {
  const [scrollY, setScrollY] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Detect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mediaQuery.matches)

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }
    mediaQuery.addEventListener("change", handleMotionChange)

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    if (!mediaQuery.matches) {
      window.addEventListener("scroll", handleScroll, { passive: true })
    }

    return () => {
      window.removeEventListener("scroll", handleScroll)
      mediaQuery.removeEventListener("change", handleMotionChange)
    }
  }, [])

  // If user prefers reduced motion, render without scroll-driven offset
  const transformStyle = reducedMotion
    ? {}
    : { transform: `translateY(${scrollY * 0.15}px)` }

  return (
    <div
      style={transformStyle}
      className={`select-none pointer-events-none transition-transform duration-75 ease-out ${className}`}
    >
      {text}
    </div>
  )
}
