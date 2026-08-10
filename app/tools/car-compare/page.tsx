import React from "react"
import Link from "next/link"
import { ArrowLeft, Car } from "lucide-react"
import CarCompareClient from "./CarCompareClient"
import carsData from "@/data/cars.json"

export const metadata = {
  title: "GTA 6 Vehicle Comparator",
  description: "Select, match, and compare vehicle specifications, acceleration, top speeds, handling, capacity, and armor in a visual Chart.js radar chart.",
}

export default function CarComparePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow">
      <div className="mb-8">
        <Link
          href="/tools"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-neon-blue hover:text-neon-pink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tools</span>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Car className="w-8 h-8 text-neon-blue animate-pulse" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            GTA 6 Car Comparator
          </h1>
        </div>
        <p className="text-foreground/60 max-w-2xl">
          Instantly compare specifications across high-end hypercars, classic muscle vehicles, SUVs, and luxury sedans. Select up to three cars to project a high-detail statistical radar chart.
        </p>
      </div>

      {/* Interactive client component */}
      <CarCompareClient cars={carsData} />
    </div>
  )
}
