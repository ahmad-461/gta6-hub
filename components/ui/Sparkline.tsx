"use client"

import React, { useEffect, useState, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface SparklineProps {
  data: number[]
  color: string
}

export default function Sparkline({ data, color }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const gradient = ctx.createLinearGradient(0, 0, 0, 40)
    gradient.addColorStop(0, `${color}33`)
    gradient.addColorStop(1, `${color}00`)

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: data.map((_, i) => i.toString()),
        datasets: [
          {
            data: data,
            borderColor: color,
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 3,
            fill: true,
            backgroundColor: gradient,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, color])

  return (
    <div className="h-10 w-full mt-2">
      <canvas ref={canvasRef} />
    </div>
  )
}
