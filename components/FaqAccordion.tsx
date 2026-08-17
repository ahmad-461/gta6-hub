"use client"

import React, { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
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
    <section className="space-y-4 pt-6 border-t border-[rgba(245,245,247,0.14)]">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-[#FF8A3D]" />
        <h2 className="text-xl sm:text-2xl font-anton uppercase text-[#F5F5F7] tracking-wide">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx
          return (
            <Card
              key={idx}
              padding="none"
              variant="standard"
              className="overflow-hidden border-[rgba(245,245,247,0.14)] transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-[#F5F5F7] hover:text-[#FF8A3D] transition-colors focus:outline-none"
              >
                <span className="pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#9E9EA8] flex-shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-[#FF8A3D]" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-[#9E9EA8] font-mono leading-relaxed border-t border-[rgba(245,245,247,0.08)] bg-[#0B0B0F]/50 animate-fadeIn">
                  <p className="whitespace-pre-line pt-3">{item.answer}</p>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
