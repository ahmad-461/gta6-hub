"use client"

import React, { useState, useEffect } from "react"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function ScrollReveal({ children, className = "", style }: ScrollRevealProps) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mediaQuery.matches) {
      setIsIntersecting(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.05 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-1000 ${
        isIntersecting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  )
}
