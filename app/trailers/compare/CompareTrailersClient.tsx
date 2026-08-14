"use client"

import React, { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, HelpCircle, RefreshCw, Sparkles, Link as LinkIcon, Plus, Info } from "lucide-react"

// Types
interface TrailerBreakdown {
  id: string
  title: string
  slug: string
  trailer_source_url: string
}

interface CompareTrailersClientProps {
  breakdowns: TrailerBreakdown[]
}

// Extractor to find video code for rendering fallback card image
function getYoutubeEmbedID(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export default function CompareTrailersClient({ breakdowns }: CompareTrailersClientProps) {
  const [selectedId1, setSelectedId1] = useState<string>("")
  const [selectedId2, setSelectedId2] = useState<string>("")

  const [customUrl1, setCustomUrl1] = useState<string>("")
  const [customUrl2, setCustomUrl2] = useState<string>("")

  const [videoId1, setVideoId1] = useState<string>("")
  const [videoId2, setVideoId2] = useState<string>("")

  // Player status
  const [player1, setPlayer1] = useState<any>(null)
  const [player2, setPlayer2] = useState<any>(null)
  const [isPlayer1Ready, setIsPlayer1Ready] = useState(false)
  const [isPlayer2Ready, setIsPlayer2Ready] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Input states toggle
  const [useCustom1, setUseCustom1] = useState(false)
  const [useCustom2, setUseCustom2] = useState(false)

  // Refs to avoid state staleness in event handlers / intervals
  const player1Ref = useRef<any>(null)
  const player2Ref = useRef<any>(null)
  const intervalRef = useRef<any>(null)
  const isScrubbingRef = useRef(false)

  // Set default selections
  useEffect(() => {
    if (breakdowns && breakdowns.length > 0) {
      // Pick first two if available
      const first = breakdowns[0]
      const second = breakdowns[1] || breakdowns[0]

      setSelectedId1(first.id)
      setVideoId1(getYoutubeEmbedID(first.trailer_source_url) || "")

      setSelectedId2(second.id)
      setVideoId2(getYoutubeEmbedID(second.trailer_source_url) || "")
    }
  }, [breakdowns])

  // Track state changes when dropdown / custom inputs alter
  useEffect(() => {
    if (!useCustom1) {
      const selected = breakdowns.find((b) => b.id === selectedId1)
      if (selected) {
        setVideoId1(getYoutubeEmbedID(selected.trailer_source_url) || "")
      }
    } else {
      setVideoId1(getYoutubeEmbedID(customUrl1) || "")
    }
  }, [selectedId1, customUrl1, useCustom1, breakdowns])

  useEffect(() => {
    if (!useCustom2) {
      const selected = breakdowns.find((b) => b.id === selectedId2)
      if (selected) {
        setVideoId2(getYoutubeEmbedID(selected.trailer_source_url) || "")
      }
    } else {
      setVideoId2(getYoutubeEmbedID(customUrl2) || "")
    }
  }, [selectedId2, customUrl2, useCustom2, breakdowns])

  // Load YouTube IFrame Player API
  useEffect(() => {
    const win = window as any
    // If API isn't loaded yet, load it
    if (!win.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    // Set global callback
    const previousCallback = win.onYouTubeIframeAPIReady
    win.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback()
      // Trigger a re-render or player generation
      setIsPlayer1Ready(false)
      setIsPlayer2Ready(false)
    }

    return () => {
      // Clean up interval on unmount
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Create or update YouTube Player instances
  useEffect(() => {
    if (!videoId1) return
    setIsPlayer1Ready(false)

    let p1: any = null
    const win = window as any

    const initPlayer1 = () => {
      if (!win.YT || !win.YT.Player) {
        setTimeout(initPlayer1, 200)
        return
      }

      // Destroy old player if exists
      if (player1Ref.current && typeof player1Ref.current.destroy === "function") {
        try {
          player1Ref.current.destroy()
        } catch (e) {
          console.warn("Destroying player 1 failed:", e)
        }
      }

      p1 = new win.YT.Player("player-container-1", {
        videoId: videoId1,
        playerVars: {
          enablejsapi: 1,
          controls: 0, // hide native controls for sync purity
          modestbranding: 1,
          rel: 0,
          origin: win.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayer1Ready(true)
            player1Ref.current = event.target
            setPlayer1(event.target)
          },
          onStateChange: (event: any) => {
            // If playing, update duration & state
            if (event.data === win.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
            } else if (event.data === win.YT.PlayerState.PAUSED) {
              // Only consider paused if player 2 is also paused/not-playing
              const p2State = player2Ref.current ? player2Ref.current.getPlayerState() : -1
              if (p2State !== win.YT.PlayerState.PLAYING) {
                setIsPlaying(false);
              }
            }
          },
        },
      })
    }

    initPlayer1()

    return () => {
      if (p1 && typeof p1.destroy === "function") {
        try {
          p1.destroy()
        } catch (e) {}
      }
    }
  }, [videoId1])

  useEffect(() => {
    if (!videoId2) return
    setIsPlayer2Ready(false)

    let p2: any = null
    const win = window as any

    const initPlayer2 = () => {
      if (!win.YT || !win.YT.Player) {
        setTimeout(initPlayer2, 200)
        return
      }

      // Destroy old player if exists
      if (player2Ref.current && typeof player2Ref.current.destroy === "function") {
        try {
          player2Ref.current.destroy()
        } catch (e) {
          console.warn("Destroying player 2 failed:", e)
        }
      }

      p2 = new win.YT.Player("player-container-2", {
        videoId: videoId2,
        playerVars: {
          enablejsapi: 1,
          controls: 0, // hide native controls for sync purity
          modestbranding: 1,
          rel: 0,
          origin: win.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayer2Ready(true)
            player2Ref.current = event.target
            setPlayer2(event.target)
          },
          onStateChange: (event: any) => {
            if (event.data === win.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
            }
          },
        },
      })
    }

    initPlayer2()

    return () => {
      if (p2 && typeof p2.destroy === "function") {
        try {
          p2.destroy()
        } catch (e) {}
      }
    }
  }, [videoId2])

  // Synchronized status polling
  useEffect(() => {
    if (isPlayer1Ready && isPlayer2Ready && player1 && player2) {
      // Periodically poll player 1 to update slider timeline state
      intervalRef.current = setInterval(() => {
        if (isScrubbingRef.current) return

        try {
          const t1 = player1.getCurrentTime()
          const d1 = player1.getDuration()
          const d2 = player2.getDuration()

          setCurrentTime(t1)
          setDuration(Math.max(d1, d2) || 120) // default fallback 2 mins
        } catch (e) {
          // ignore transient player errors
        }
      }, 250)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlayer1Ready, isPlayer2Ready, player1, player2])

  // Synchronization Commands
  const handlePlayPause = () => {
    if (!player1 || !player2 || !isPlayer1Ready || !isPlayer2Ready) return

    try {
      if (isPlaying) {
        player1.pauseVideo()
        player2.pauseVideo()
        setIsPlaying(false)
      } else {
        // Seek player 2 to match player 1 exactly prior to playback to ensure sync start
        const t1 = player1.getCurrentTime()
        player2.seekTo(t1, true)

        player1.playVideo()
        player2.playVideo()
        setIsPlaying(true)
      }
    } catch (err) {
      console.warn("Failed play/pause command:", err)
    }
  }

  const handleResync = () => {
    if (!player1 || !player2 || !isPlayer1Ready || !isPlayer2Ready) return
    try {
      const t1 = player1.getCurrentTime()
      player2.seekTo(t1, true)

      if (isPlaying) {
        player1.playVideo()
        player2.playVideo()
      }
    } catch (err) {
      console.warn("Failed resync:", err)
    }
  }

  const handleReset = () => {
    if (!player1 || !player2 || !isPlayer1Ready || !isPlayer2Ready) return
    try {
      player1.seekTo(0, true)
      player2.seekTo(0, true)
      player1.pauseVideo()
      player2.pauseVideo()
      setCurrentTime(0)
      setIsPlaying(false)
    } catch (err) {
      console.warn("Failed reset:", err)
    }
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setCurrentTime(val)
    if (!player1 || !player2) return

    try {
      player1.seekTo(val, true)
      player2.seekTo(val, true)
    } catch (err) {}
  }

  const handleScrubStart = () => {
    isScrubbingRef.current = true
  }

  const handleScrubEnd = () => {
    isScrubbingRef.current = false
  }

  const formatTimeLabel = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <div className="space-y-8">
      {/* Selection Control Panel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stream A Panel */}
        <div className="p-6 bg-[#16161B] border border-[rgba(245,245,247,0.1)] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-[#FF2D8D] tracking-widest uppercase">STREAM CHANNEL A</span>
            <button
              onClick={() => setUseCustom1(!useCustom1)}
              className="text-xs text-foreground/50 hover:text-white transition font-mono font-bold uppercase"
            >
              {useCustom1 ? "Select breakdown" : "Use Custom YouTube URL"}
            </button>
          </div>

          {useCustom1 ? (
            <div className="space-y-2">
              <label className="block text-xs font-mono text-[#9E9EA8] uppercase">Custom YouTube Link / ID</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF8A3D]" />
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={customUrl1}
                  onChange={(e) => setCustomUrl1(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-[rgba(245,245,247,0.14)] focus:border-[#FF2D8D] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-foreground/30 font-mono outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-mono text-[#9E9EA8] uppercase">Select Breakdown Archive</label>
              <select
                value={selectedId1}
                onChange={(e) => setSelectedId1(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-[rgba(245,245,247,0.14)] focus:border-[#FF2D8D] rounded-lg px-3 py-2.5 text-xs text-[#F5F5F7] font-mono outline-none"
              >
                {breakdowns.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stream B Panel */}
        <div className="p-6 bg-[#16161B] border border-[rgba(245,245,247,0.1)] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-[#FF8A3D] tracking-widest uppercase">STREAM CHANNEL B</span>
            <button
              onClick={() => setUseCustom2(!useCustom2)}
              className="text-xs text-foreground/50 hover:text-white transition font-mono font-bold uppercase"
            >
              {useCustom2 ? "Select breakdown" : "Use Custom YouTube URL"}
            </button>
          </div>

          {useCustom2 ? (
            <div className="space-y-2">
              <label className="block text-xs font-mono text-[#9E9EA8] uppercase">Custom YouTube Link / ID</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF8A3D]" />
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={customUrl2}
                  onChange={(e) => setCustomUrl2(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-[rgba(245,245,247,0.14)] focus:border-[#FF8A3D] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-foreground/30 font-mono outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-mono text-[#9E9EA8] uppercase">Select Breakdown Archive</label>
              <select
                value={selectedId2}
                onChange={(e) => setSelectedId2(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-[rgba(245,245,247,0.14)] focus:border-[#FF8A3D] rounded-lg px-3 py-2.5 text-xs text-[#F5F5F7] font-mono outline-none"
              >
                {breakdowns.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Synchronized Unified Control Console */}
      <div className="p-6 bg-[#16161B] border border-[#FF8A3D]/20 rounded-xl space-y-4 shadow-[0_0_20px_rgba(255,138,61,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              disabled={!isPlayer1Ready || !isPlayer2Ready}
              className="flex items-center justify-center h-12 w-12 rounded-full bg-[#FF8A3D] hover:bg-[#FF8A3D]/90 disabled:bg-gray-700 text-black shadow-lg transition-transform hover:scale-105 active:scale-95 duration-200"
              title={isPlaying ? "Pause Stream Group" : "Play Stream Group"}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>

            {/* Sync Corrector */}
            <button
              onClick={handleResync}
              disabled={!isPlayer1Ready || !isPlayer2Ready}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg border border-[#FF8A3D]/40 hover:bg-[#FF8A3D]/10 text-[#FF8A3D] font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 disabled:opacity-40"
              title="Force align player B to player A timestamp"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Resync Players</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              disabled={!isPlayer1Ready || !isPlayer2Ready}
              className="flex items-center space-x-1 px-3 py-2.5 rounded-lg border border-[rgba(245,245,247,0.1)] hover:bg-white/5 text-[#9E9EA8] hover:text-white font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Timestamp Indicators */}
          <div className="font-mono text-xs text-[#9E9EA8] flex items-center gap-2">
            <span className="text-[#F5F5F7] font-black">{formatTimeLabel(currentTime)}</span>
            <span>/</span>
            <span>{formatTimeLabel(duration)}</span>
          </div>
        </div>

        {/* Scrub Timeline Range Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleScrub}
            onMouseDown={handleScrubStart}
            onMouseUp={handleScrubEnd}
            onTouchStart={handleScrubStart}
            onTouchEnd={handleScrubEnd}
            disabled={!isPlayer1Ready || !isPlayer2Ready}
            className="w-full h-1.5 bg-[#0B0B0F] border border-[rgba(245,245,247,0.08)] rounded-lg appearance-none cursor-pointer accent-[#FF8A3D] disabled:opacity-30"
          />
          <div className="flex justify-between text-[9px] font-mono text-[#9E9EA8]/50 uppercase tracking-widest">
            <span>START FRAME</span>
            <span>TIMELINE SCRUB RANGE</span>
            <span>END FRAME</span>
          </div>
        </div>
      </div>

      {/* Split-Screen Embedded Video Outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Player Container A */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold px-1 text-[#9E9EA8]">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPlayer1Ready ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span>FEED A ({videoId1 ? `YT ID: ${videoId1}` : "NO INPUT"})</span>
            </span>
          </div>

          <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-[rgba(245,245,247,0.1)] bg-black relative shadow-2xl">
            {videoId1 ? (
              <div id="player-container-1" className="absolute inset-0 w-full h-full" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-xs font-mono text-foreground/40 space-y-2 bg-[#0B0B0F]">
                <Plus className="w-8 h-8 text-foreground/20 animate-bounce" />
                <p className="uppercase tracking-wider text-[#9E9EA8]">Waiting for Video ID A</p>
              </div>
            )}
            {/* Transparent click blocker to prevent users clicking native player directly and breaking sync */}
            {isPlayer1Ready && (
              <div className="absolute inset-0 pointer-events-none" />
            )}
          </div>
        </div>

        {/* Player Container B */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold px-1 text-[#9E9EA8]">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPlayer2Ready ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span>FEED B ({videoId2 ? `YT ID: ${videoId2}` : "NO INPUT"})</span>
            </span>
          </div>

          <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-[rgba(245,245,247,0.1)] bg-black relative shadow-2xl">
            {videoId2 ? (
              <div id="player-container-2" className="absolute inset-0 w-full h-full" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-xs font-mono text-foreground/40 space-y-2 bg-[#0B0B0F]">
                <Plus className="w-8 h-8 text-foreground/20 animate-bounce" />
                <p className="uppercase tracking-wider text-[#9E9EA8]">Waiting for Video ID B</p>
              </div>
            )}
            {/* Transparent click blocker to prevent users clicking native player directly and breaking sync */}
            {isPlayer2Ready && (
              <div className="absolute inset-0 pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* Sync drift fallback explanation notice */}
      <div className="p-4 bg-[#16161B] border border-[rgba(245,245,247,0.08)] rounded-xl flex items-start space-x-3 max-w-4xl mx-auto">
        <Info className="w-5 h-5 text-[#FF8A3D] shrink-0 mt-0.5" />
        <div className="text-xs text-[#9E9EA8] leading-relaxed space-y-1 font-sans">
          <p className="font-bold text-[#F5F5F7] uppercase tracking-wider font-mono">Synchronization Drift Disclaimer</p>
          <p>
            Because YouTube embeds are rendered client-side on separate frames, slight performance lags, network latency, or buffering may cause the players to drift out of sync naturally. This tool is designed for cooperative comparative observation rather than sub-millisecond, frame-perfect scientific alignment.
          </p>
          <p className="font-mono text-[10px] text-[#FF8A3D] uppercase font-bold pt-1">
            TIP: Click the &quot;RESYNC PLAYERS&quot; button at any point to instantly re-align Feed B with Feed A&apos;s active frame.
          </p>
        </div>
      </div>
    </div>
  )
}
