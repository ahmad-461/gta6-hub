"use client"

import React, { useState, useEffect } from "react"
import { AlignLeft } from "lucide-react"

interface TocItem {
  id: string
  text: string
  level: number
}

interface GuideTocProps {
  toc: TocItem[]
}

export default function GuideToc({ toc }: GuideTocProps) {
  const [activeId, setActiveId] = useState("")

  useEffect(() => {
    if (!toc || toc.length === 0) return

    const observerOptions = {
      root: null,
      rootMargin: "-100px 0px -40% 0px",
      threshold: 0,
    }

    const headingElements = toc
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver((entries) => {
      const intersecting = entries.filter((e) => e.isIntersecting)
      if (intersecting.length > 0) {
        setActiveId(intersecting[0].target.id)
      }
    }, observerOptions)

    headingElements.forEach((el) => observer.observe(el))

    return () => {
      headingElements.forEach((el) => observer.unobserve(el))
    }
  }, [toc])

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
      setActiveId(id)
    }
  }

  if (!toc || toc.length === 0) return null

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-5 shadow-md sticky top-24 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 border-b border-card-border pb-2 text-foreground/50">
        <AlignLeft className="w-4 h-4 text-neon-blue" />
        <h3 className="font-extrabold text-xs uppercase tracking-widest">
          Table Of Contents
        </h3>
      </div>

      <nav className="space-y-1.5 text-xs">
        {toc.map((item) => {
          const isActive = activeId === item.id
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleLinkClick(e, item.id)}
              className={`block py-1 px-2.5 rounded transition-all duration-150 font-bold border-l-2 leading-relaxed ${
                isActive
                  ? "border-neon-blue text-neon-blue bg-neon-blue/5"
                  : "border-transparent text-foreground/60 hover:text-white hover:border-foreground/20"
              } ${item.level > 2 ? "pl-5" : ""}`}
            >
              {item.text}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
