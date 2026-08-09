"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"
import { Radar } from "react-chartjs-2"
import { ArrowLeft, Car, HelpCircle, Info, Plus, Sparkles, Trash2 } from "lucide-react"

// Register ChartJS elements
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

interface CarData {
  id: string
  name: string
  category: string
  stats: {
    topSpeed: number
    acceleration: number
    handling: number
    capacity: number
    armor: number
  }
  description: string
}

interface CarCompareClientProps {
  cars: CarData[]
}

const COLORS = [
  {
    border: "#ec4899", // pink
    background: "rgba(236, 72, 153, 0.25)",
    accent: "text-neon-pink"
  },
  {
    border: "#3b82f6", // blue
    background: "rgba(59, 130, 246, 0.25)",
    accent: "text-neon-blue"
  },
  {
    border: "#facc15", // yellow
    background: "rgba(250, 204, 21, 0.25)",
    accent: "text-neon-yellow"
  }
]

export default function CarCompareClient({ cars }: CarCompareClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "pegassi-tempesta",
    "grotti-cheetah-classic"
  ])

  const handleSelectCar = (id: string) => {
    if (selectedIds.includes(id)) {
      return // Already selected
    }
    if (selectedIds.length >= 3) {
      alert("You can select a maximum of 3 cars for comparison.")
      return
    }
    setSelectedIds([...selectedIds, id])
  }

  const handleRemoveCar = (id: string) => {
    setSelectedIds(selectedIds.filter((cid) => cid !== id))
  }

  // Find selected car objects
  const selectedCars = useMemo(() => {
    return selectedIds
      .map((id) => cars.find((c) => c.id === id))
      .filter((c): c is CarData => !!c)
  }, [selectedIds, cars])

  // Filter out already selected cars for dropdown
  const availableCars = useMemo(() => {
    return cars.filter((c) => !selectedIds.includes(c.id))
  }, [cars, selectedIds])

  // Chart Data compilation
  const chartData = useMemo(() => {
    return {
      labels: ["Top Speed", "Acceleration", "Handling", "Capacity Size", "Armor Durability"],
      datasets: selectedCars.map((car, idx) => {
        const colorSet = COLORS[idx % COLORS.length]
        // Scale capacity (which is between 1 and 8) to be proportional to scores out of 100
        // We'll scale it so that 8 seats is 100% capacity score
        const scaledCapacity = Math.round((car.stats.capacity / 8) * 100)

        return {
          label: car.name,
          data: [
            car.stats.topSpeed,
            car.stats.acceleration,
            car.stats.handling,
            scaledCapacity,
            car.stats.armor
          ],
          backgroundColor: colorSet.background,
          borderColor: colorSet.border,
          borderWidth: 3,
          pointBackgroundColor: colorSet.border,
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: colorSet.border,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      })
    }
  }, [selectedCars])

  // Chart configuration options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: "rgba(255, 255, 255, 0.1)"
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)"
        },
        pointLabels: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            family: "sans-serif",
            size: 11,
            weight: "bold" as const
          }
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.4)",
          backdropColor: "transparent",
          font: {
            size: 9
          },
          stepSize: 20,
          min: 0,
          max: 100
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
          font: {
            family: "sans-serif",
            size: 12,
            weight: "bold" as const
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.dataIndex === 3) {
              // Convert scaled capacity back to raw capacity for realistic display
              const originalCar = selectedCars[context.datasetIndex]
              if (originalCar) {
                label += `${originalCar.stats.capacity} seats`
                return label
              }
            }
            label += context.formattedValue
            return label
          }
        }
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Selection Control Panel (Left column) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-card-bg/60 border border-card-border p-6 rounded-xl space-y-5 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-neon-blue">
            <Car className="w-4 h-4" />
            <span>GARAGE SELECTION</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/60 block mb-2 uppercase tracking-wide">
              Add Vehicle to Comparison ({selectedIds.length}/3)
            </label>
            <div className="relative">
              <select
                disabled={selectedIds.length >= 3}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectCar(e.target.value)
                    e.target.value = "" // Reset selection index
                  }
                }}
                className="w-full bg-background border border-card-border hover:border-card-border/80 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-sm text-white rounded-lg px-4 py-3 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <option value="">
                  {selectedIds.length >= 3
                    ? "Garage limit reached (max 3 cars)"
                    : "Choose a vehicle..."}
                </option>
                {availableCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name} ({car.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Selected Vehicles */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-white/40 block uppercase tracking-wide">
              Selected Vehicles
            </span>

            {selectedCars.length > 0 ? (
              <div className="space-y-2.5">
                {selectedCars.map((car, idx) => {
                  const colorSet = COLORS[idx % COLORS.length]
                  return (
                    <div
                      key={car.id}
                      className="flex items-center justify-between p-3.5 bg-background border border-card-border rounded-lg group transition-all"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Colored accent indicator */}
                        <div
                          className="w-3.5 h-3.5 rounded shrink-0"
                          style={{ backgroundColor: colorSet.border }}
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">
                            {car.name}
                          </h4>
                          <p className="text-[10px] text-foreground/40 font-semibold uppercase">
                            {car.category}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveCar(car.id)}
                        className="p-1.5 hover:bg-white/5 text-foreground/40 hover:text-red-400 rounded transition-all shrink-0"
                        title="Remove vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-card-border/60 rounded-lg">
                <HelpCircle className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-foreground/40">No vehicles selected. Select up to 3 cars from the dropdown to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Cars Description Details */}
        {selectedCars.length > 0 && (
          <div className="space-y-3">
            {selectedCars.map((car, idx) => {
              const colorSet = COLORS[idx % COLORS.length]
              return (
                <div
                  key={car.id}
                  className="bg-card-bg/40 border border-card-border p-4.5 rounded-lg space-y-2 relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: colorSet.border }}
                  />
                  <div className="flex justify-between items-start">
                    <h5 className="text-sm font-black text-white">{car.name}</h5>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/5 text-foreground/50 uppercase">
                      {car.stats.capacity}-Seater
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    {car.description}
                  </p>

                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px]">
                    <div className="bg-background/80 border border-card-border/60 rounded p-1">
                      <span className="text-foreground/40 block">SPEED</span>
                      <strong className="text-white font-extrabold">{car.stats.topSpeed}</strong>
                    </div>
                    <div className="bg-background/80 border border-card-border/60 rounded p-1">
                      <span className="text-foreground/40 block">ACCEL</span>
                      <strong className="text-white font-extrabold">{car.stats.acceleration}</strong>
                    </div>
                    <div className="bg-background/80 border border-card-border/60 rounded p-1">
                      <span className="text-foreground/40 block">HANDL</span>
                      <strong className="text-white font-extrabold">{car.stats.handling}</strong>
                    </div>
                    <div className="bg-background/80 border border-card-border/60 rounded p-1">
                      <span className="text-foreground/40 block">ARMOR</span>
                      <strong className="text-white font-extrabold">{car.stats.armor}</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Radar Chart Display (Right column) */}
      <div className="lg:col-span-7">
        <div className="bg-card-bg/60 border border-card-border p-6 rounded-xl flex flex-col justify-between min-h-[480px] backdrop-blur-sm shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-neon-pink" />
          <div className="flex items-center justify-between border-b border-card-border/80 pb-4 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white">STATISTICAL OVERVIEW</h3>
              <p className="text-[11px] text-foreground/40">Radar index comparing structural and speed attributes</p>
            </div>
            <div className="bg-neon-pink/10 border border-neon-pink/20 px-2.5 py-1 rounded flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neon-pink" />
              <span className="text-[9px] font-bold text-neon-pink uppercase tracking-wider">Chart.js Engine</span>
            </div>
          </div>

          <div className="relative flex-grow flex items-center justify-center min-h-[340px]">
            {selectedCars.length > 0 ? (
              <div className="w-full h-full min-h-[340px] relative">
                <Radar data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="text-center p-8 text-foreground/30 flex flex-col items-center justify-center space-y-3">
                <Car className="w-16 h-16 text-foreground/10 stroke-1" />
                <p className="text-sm font-semibold">Select at least one vehicle to render stats comparison.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-card-border/80 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-neon-blue shrink-0 mt-0.5" />
            <p className="text-[10px] text-foreground/50 leading-relaxed">
              * Note: Capacity values are scaled dynamically on the radar chart to represent seat density proportional to numerical speed attributes (up to 8 seats). Tooltips show raw seating capacity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
