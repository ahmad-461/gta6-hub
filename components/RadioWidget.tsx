"use client"

import React, { useState, useEffect, useRef } from "react"
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Radio, ChevronUp, ChevronDown, Music } from "lucide-react"

const STATIONS = [
  { name: "Leonida Drive", url: "/audio/leonida_drive.wav", description: "Sunset synthwave & driving pulses" },
  { name: "Static Rumors FM", url: "/audio/static_rumors_fm.wav", description: "Mysterious ambient & deep leaks" },
  { name: "Vice Frequencies", url: "/audio/vice_frequencies.wav", description: "Glittering neon arpeggios" },
  { name: "Mission Row Static", url: "/audio/mission_row_static.wav", description: "Dark industrial bass drone" }
]

export default function RadioWidget() {
  const [currentStationIdx, setCurrentStationIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Prevent server side rendering mismatch for localStorage and audio
  useEffect(() => {
    setIsMounted(true)

    // Load state from localStorage on mount
    const savedStation = localStorage.getItem("gta6_radio_station")
    const savedVolume = localStorage.getItem("gta6_radio_volume")
    const savedMuted = localStorage.getItem("gta6_radio_muted")
    const savedMinimized = localStorage.getItem("gta6_radio_minimized")

    if (savedStation !== null) {
      setCurrentStationIdx(Math.min(STATIONS.length - 1, Math.max(0, parseInt(savedStation, 10))))
    }
    if (savedVolume !== null) {
      setVolume(parseFloat(savedVolume))
    }
    if (savedMuted !== null) {
      setIsMuted(savedMuted === "true")
    }
    if (savedMinimized !== null) {
      setIsMinimized(savedMinimized === "true")
    }
  }, [])

  // Sync state changes with localStorage
  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem("gta6_radio_station", currentStationIdx.toString())
  }, [currentStationIdx, isMounted])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem("gta6_radio_volume", volume.toString())
  }, [volume, isMounted])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem("gta6_radio_muted", isMuted.toString())
  }, [isMuted, isMounted])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem("gta6_radio_minimized", isMinimized.toString())
  }, [isMinimized, isMounted])

  // Play/Pause handling
  useEffect(() => {
    if (!isMounted || !audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn("Playback blocked by browser auto-play policy or file loading", err)
        setIsPlaying(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, currentStationIdx, isMounted])

  // Volume & Mute sync
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const handleNextStation = () => {
    setCurrentStationIdx((prev) => (prev + 1) % STATIONS.length)
  }

  const handlePrevStation = () => {
    setCurrentStationIdx((prev) => (prev - 1 + STATIONS.length) % STATIONS.length)
  }

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev)
  }

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = parseFloat(e.target.value)
    setVolume(nextVolume)
    if (nextVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  if (!isMounted) return null

  const activeStation = STATIONS[currentStationIdx]

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] w-80 font-mono transition-all duration-300">
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={activeStation.url}
        loop
        preload="auto"
      />

      <div className="bg-ink-2/95 backdrop-blur border border-[rgba(245,240,250,0.18)] rounded-xl shadow-[0_0_25px_rgba(255,46,136,0.15)] overflow-hidden">
        {/* Header bar / Minimize button */}
        <div
          onClick={() => setIsMinimized(!isMinimized)}
          className="flex items-center justify-between px-3.5 py-1.5 bg-ink/90 border-b border-[rgba(245,240,250,0.1)] cursor-pointer select-none text-paper-dim hover:text-white transition-colors"
        >
          <div className="flex items-center space-x-1.5">
            <Radio size={12} className={`text-orange ${isPlaying ? "animate-pulse" : ""}`} />
            <span className="text-[10px] font-black tracking-widest uppercase">VICE AUDIO RECEIVER</span>
          </div>
          <button className="focus:outline-none">
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Maximized/Active display */}
        <div className={`transition-all duration-300 overflow-hidden ${isMinimized ? "h-0 opacity-0" : "p-4 space-y-4"}`}>

          {/* LCD/Segmented-style station screen */}
          <div className="relative bg-ink border border-[rgba(245,240,250,0.08)] p-3 rounded-lg overflow-hidden flex flex-col justify-center">
            {/* Ambient waveform visualization */}
            {isPlaying && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-end gap-0.5 h-6 opacity-30 select-none pointer-events-none motion-reduce:hidden">
                <span className="w-0.5 bg-orange animate-[pulse_0.8s_infinite] h-4" />
                <span className="w-0.5 bg-magenta animate-[pulse_1.2s_infinite] h-6" />
                <span className="w-0.5 bg-orange animate-[pulse_0.9s_infinite] h-3" />
                <span className="w-0.5 bg-magenta animate-[pulse_1.1s_infinite] h-5" />
              </div>
            )}

            <div className="text-[9px] text-paper-dim tracking-wider uppercase font-black mb-1 flex justify-between">
              <span>TUNED STATION</span>
              {isPlaying ? (
                <span className="text-orange animate-pulse">ON AIR</span>
              ) : (
                <span className="text-paper-dim/50">STANDBY</span>
              )}
            </div>

            {/* LCD station title */}
            <div className="text-lg font-bold text-orange tracking-wide truncate uppercase select-all font-mono">
              {activeStation.name}
            </div>

            {/* Description sub-label */}
            <div className="text-[10px] text-magenta truncate mt-0.5 select-none leading-none">
              {activeStation.description}
            </div>
          </div>

          {/* Controls button deck */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevStation}
                className="p-2 bg-ink/60 hover:bg-magenta/10 border border-[rgba(245,240,250,0.08)] text-paper-dim hover:text-white rounded transition"
                title="Previous Station"
              >
                <SkipBack size={14} />
              </button>

              <button
                onClick={handleTogglePlay}
                className="p-2.5 bg-magenta hover:bg-magenta/95 text-white rounded-lg shadow-[0_0_10px_rgba(255,46,136,0.3)] transition transform hover:scale-105 active:scale-95"
                title={isPlaying ? "Pause" : "Play Radio"}
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>

              <button
                onClick={handleNextStation}
                className="p-2 bg-ink/60 hover:bg-magenta/10 border border-[rgba(245,240,250,0.08)] text-paper-dim hover:text-white rounded transition"
                title="Next Station"
              >
                <SkipForward size={14} />
              </button>
            </div>

            {/* Volume slider & mute control */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className="p-2 text-paper-dim hover:text-white transition"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX size={14} className="text-magenta" /> : <Volume2 size={14} className="text-orange" />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-ink rounded-lg appearance-none cursor-pointer accent-[#FF2D8D] focus:outline-none"
                title="Receiver Volume"
              />
            </div>
          </div>
        </div>

        {/* Minimized strip view */}
        <div
          onClick={() => setIsMinimized(false)}
          className={`flex items-center justify-between p-2.5 bg-ink-2 cursor-pointer hover:bg-[#1a0f28] transition-all duration-300 ${!isMinimized ? "h-0 p-0 overflow-hidden opacity-0 pointer-events-none" : "h-auto opacity-100"}`}
        >
          <div className="flex items-center space-x-2 truncate">
            <Music size={12} className={`text-magenta shrink-0 ${isPlaying ? "animate-spin-slow" : ""}`} />
            <span className="text-[10px] font-black text-white truncate uppercase">
              {isPlaying ? `NOW PLAYING: ${activeStation.name}` : "RADIO STANDBY"}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent maximize trigger
              handleTogglePlay()
            }}
            className="p-1 bg-magenta text-white rounded text-xs transition active:scale-95 ml-2"
          >
            {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
          </button>
        </div>
      </div>
    </div>
  )
}
