"use client"

import React, { useState } from "react"
import { ChevronDown } from "lucide-react"
import Card from "@/components/ui/Card"

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqItem[]
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (!items || !Array.isArray(items) || items.length === 0) {
    return null
  }

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx
        const triggerId = `faq-trigger-${idx}`
        const panelId = `faq-panel-${idx}`

        return (
          <Card
            key={idx}
            padding="none"
            variant="standard"
            className="overflow-hidden border-[rgba(245,245,247,0.14)] hover:border-[#FF8A3D]/40 transition-colors duration-200"
          >
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleAccordion(idx)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-[#F5F5F7] hover:text-[#FF8A3D] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A3D]/80"
            >
              <span className="pr-4">{item.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-[#9E9EA8] flex-shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                  isOpen ? "rotate-180 text-[#FF8A3D]" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-[#9E9EA8] font-mono leading-relaxed border-t border-[rgba(245,245,247,0.08)] bg-[#0B0B0F]/50 animate-fadeIn"
              >
                <p className="whitespace-pre-line pt-3.5">{item.answer}</p>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
