"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  Clipboard,
  Gamepad,
  HelpCircle,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
  Zap
} from "lucide-react"

interface DbCharacter {
  id?: string
  name: string
  slug: string
  biography: string
  stats_json?: Record<string, any>
  featured_image?: string
}

interface QuizClientProps {
  dbCharacters: DbCharacter[]
}

interface Question {
  text: string
  options: {
    text: string
    traits: Record<string, number>
  }[]
}

const QUESTIONS: Question[] = [
  {
    text: "Your ideal getaway vehicle?",
    options: [
      { text: "A high-tech modified electric sedan", traits: { tech_savvy: 2, stealth: 1 } },
      { text: "An armored heavy-duty military SUV", traits: { aggression: 2, loyalty: 1 } },
      { text: "A supercharged neon-pink drift sports car", traits: { street_smart: 2, chaos: 1 } },
      { text: "A tuned motorcycle for filtering through tight alleys", traits: { chaos: 2, stealth: 1 } }
    ]
  },
  {
    text: "How do you approach a locked warehouse guarded by hostiles?",
    options: [
      { text: "Hack the security cameras and slip in quietly", traits: { stealth: 2, tech_savvy: 1 } },
      { text: "Drive a truck through the front gate with weapons drawn", traits: { aggression: 2, chaos: 1 } },
      { text: "Pay off a contact inside to leave a side door unlocked", traits: { street_smart: 2, loyalty: 1 } },
      { text: "Create a massive explosive distraction in the rear, then sneak in", traits: { chaos: 2, tech_savvy: 1 } }
    ]
  },
  {
    text: "What is your primary role in a coordinated heist?",
    options: [
      { text: "The mastermind planner who disables the alarms", traits: { tech_savvy: 2, stealth: 1 } },
      { text: "The crowd control enforcer who holds down the lobby", traits: { aggression: 2, loyalty: 1 } },
      { text: "The smooth-talking driver who handles the getaway", traits: { street_smart: 2, chaos: 1 } },
      { text: "The lockpicker/hacker who bags the cash", traits: { tech_savvy: 1, street_smart: 2 } }
    ]
  },
  {
    text: "How do you spend your hard-earned cartel cash?",
    options: [
      { text: "Investing in high-yield underground stock markets and real estate", traits: { street_smart: 1, tech_savvy: 2 } },
      { text: "Pimping out custom sports cars and buying neon outfits", traits: { chaos: 2, street_smart: 1 } },
      { text: "Buying military-grade armor and heavy weapon upgrades", traits: { aggression: 2, chaos: 1 } },
      { text: "Splitting it with your closest crew members to secure their trust", traits: { loyalty: 2, stealth: 1 } }
    ]
  },
  {
    text: "What is your ultimate rule of the criminal underworld?",
    options: [
      { text: "Never leave a partner behind, no matter the cost", traits: { loyalty: 2, aggression: 1 } },
      { text: "Outsmart your enemies before they even know you're there", traits: { stealth: 2, tech_savvy: 1 } },
      { text: "High risk, maximum payout — keep the adrenaline pumping", traits: { chaos: 2, aggression: 1 } },
      { text: "It's not personal, it's just business. Play all sides", traits: { street_smart: 2, tech_savvy: 1 } }
    ]
  },
  {
    text: "If you're cornered by the SWAT in an alley, you...",
    options: [
      { text: "Deploy a smoke bomb and use a grappling hook to escape", traits: { stealth: 2, chaos: 1 } },
      { text: "Unload a light machine gun and fight your way out", traits: { aggression: 2, loyalty: 1 } },
      { text: "Use your hacker drone to trigger a transformer explosion", traits: { tech_savvy: 2, chaos: 1 } },
      { text: "Bluff your way through or bribe the lead officer", traits: { street_smart: 2, loyalty: 1 } }
    ]
  },
  {
    text: "Your partner gets caught in a sting operation. You:",
    options: [
      { text: "Plan a meticulously timed break-out from the prison transport", traits: { tech_savvy: 1, stealth: 2 } },
      { text: "Storm the police station head-on with heavy backup", traits: { aggression: 2, loyalty: 1 } },
      { text: "Call in favors from corrupt politicians to dismiss the case", traits: { street_smart: 2, tech_savvy: 1 } },
      { text: "Create absolute chaos in the city center to force a trade", traits: { chaos: 2, loyalty: 1 } }
    ]
  },
  {
    text: "Which neighborhood in Leonida do you call home?",
    options: [
      { text: "A high-rise luxury penthouse in downtown Vice City", traits: { tech_savvy: 1, street_smart: 2 } },
      { text: "A hidden caravan trailer deep in the swampy Everglades", traits: { stealth: 2, chaos: 1 } },
      { text: "A busy street warehouse in the industrial port docks", traits: { aggression: 2, street_smart: 1 } },
      { text: "A beachfront beach club suite on the sandy coast", traits: { loyalty: 2, chaos: 1 } }
    ]
  }
]

const DEFAULT_CHARACTERS: DbCharacter[] = [
  {
    name: "Lucia",
    slug: "lucia",
    biography: "Lucia is a resilient street-smart operator who knows her way around security, high-tech hacking, and strategic getaways. Driven by ambition and fierce loyalty to her partner, she's a formidable mastermind in the Vice City underground, preferring stealth and leverage over mindless violence.",
    stats_json: { role: "Mastermind", affiliation: "Vice City Crew", intelligence: "High" }
  },
  {
    name: "Jason",
    slug: "jason",
    biography: "Jason is an action-first, tactical survivalist who excels in high-adrenaline combat, heavy-firepower defense, and high-speed vehicular chases. While quiet and rugged, his protective instincts and reckless chaos make him an indispensable front-line enforcer who thrives under fire.",
    stats_json: { role: "Enforcer", affiliation: "Vice City Crew", firepower: "Extreme" }
  }
]

export default function QuizClient({ dbCharacters }: QuizClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({
    stealth: 0,
    aggression: 0,
    street_smart: 0,
    tech_savvy: 0,
    loyalty: 0,
    chaos: 0
  })

  const [isQuizCompleted, setIsQuizCompleted] = useState(false)
  const [isLoadingMatch, setIsLoadingMatch] = useState(false)
  const [loadingText, setLoadingText] = useState("")

  const [matchedCharacter, setMatchedCharacter] = useState<DbCharacter | null>(null)
  const [matchPercentage, setMatchPercentage] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)

  // Fallback to defaults if DB is empty
  const characters = dbCharacters.length > 0 ? dbCharacters : DEFAULT_CHARACTERS

  // Pre-load shared result if present in query params
  useEffect(() => {
    const charSlug = searchParams.get("char")
    const pct = searchParams.get("pct")

    if (charSlug && pct) {
      const match = characters.find((c) => c.slug.toLowerCase() === charSlug.toLowerCase())
      if (match) {
        setMatchedCharacter(match)
        setMatchPercentage(parseInt(pct, 10) || 95)
        setIsQuizCompleted(true)
      }
    }
  }, [searchParams, characters])

  const handleAnswerSelect = (traits: Record<string, number>) => {
    // Add weights to answers
    const updatedAnswers = { ...answers }
    Object.entries(traits).forEach(([trait, score]) => {
      updatedAnswers[trait] = (updatedAnswers[trait] || 0) + score
    })
    setAnswers(updatedAnswers)

    const nextIdx = currentQuestionIdx + 1
    if (nextIdx < QUESTIONS.length) {
      setCurrentQuestionIdx(nextIdx)
    } else {
      runMatchingAlgorithm(updatedAnswers)
    }
  }

  const runMatchingAlgorithm = (finalAnswers: Record<string, number>) => {
    setIsLoadingMatch(true)
    const texts = [
      "Analyzing your criminal background...",
      "Checking LCPD mugshots and warrants...",
      "Calculating street credibility in Leonida...",
      "Mapping personality traits to criminal syndicate databases..."
    ]

    let currentTextIdx = 0
    setLoadingText(texts[0])

    const interval = setInterval(() => {
      currentTextIdx++
      if (currentTextIdx < texts.length) {
        setLoadingText(texts[currentTextIdx])
      }
    }, 700)

    setTimeout(() => {
      clearInterval(interval)

      // Dynamic compatibility calculation
      let bestMatch: DbCharacter = characters[0]
      let maxScore = -1

      characters.forEach((char) => {
        // Build character trait profile
        const charProfile: Record<string, number> = {
          stealth: 1,
          aggression: 1,
          street_smart: 1,
          tech_savvy: 1,
          loyalty: 1,
          chaos: 1
        }

        // Apply biography heuristics
        const bio = char.biography.toLowerCase()
        const name = char.name.toLowerCase()
        const slug = char.slug.toLowerCase()

        if (bio.includes("hack") || bio.includes("tech") || bio.includes("comput") || bio.includes("alarm") || bio.includes("security")) {
          charProfile.tech_savvy += 3
        }
        if (bio.includes("stealth") || bio.includes("sneak") || bio.includes("shadow") || bio.includes("quiet") || bio.includes("silent")) {
          charProfile.stealth += 3
        }
        if (bio.includes("fight") || bio.includes("shoot") || bio.includes("weapon") || bio.includes("military") || bio.includes("heavy") || bio.includes("kill") || bio.includes("enforc")) {
          charProfile.aggression += 3
        }
        if (bio.includes("street") || bio.includes("race") || bio.includes("drift") || bio.includes("dealer") || bio.includes("hustle") || bio.includes("cash") || bio.includes("business")) {
          charProfile.street_smart += 3
        }
        if (bio.includes("loyal") || bio.includes("trust") || bio.includes("partner") || bio.includes("love") || bio.includes("friend") || bio.includes("crew")) {
          charProfile.loyalty += 3
        }
        if (bio.includes("chaos") || bio.includes("wild") || bio.includes("crazy") || bio.includes("bomb") || bio.includes("blast") || bio.includes("stunt")) {
          charProfile.chaos += 3
        }

        // Apply character specific hardcodings for standard figures
        if (slug.includes("lucia")) {
          charProfile.loyalty += 4
          charProfile.street_smart += 3
          charProfile.tech_savvy += 3
          charProfile.stealth += 2
        } else if (slug.includes("jason")) {
          charProfile.aggression += 4
          charProfile.chaos += 4
          charProfile.stealth += 3
          charProfile.street_smart += 2
        }

        // Compute dot-product-like similarity
        let dotProduct = 0
        let userSum = 0
        let charSum = 0

        Object.keys(charProfile).forEach((trait) => {
          const uVal = finalAnswers[trait] || 0
          const cVal = charProfile[trait] || 0
          dotProduct += uVal * cVal
          userSum += uVal * uVal
          charSum += cVal * cVal
        })

        const similarity = dotProduct / (Math.sqrt(userSum) * Math.sqrt(charSum) || 1)
        if (similarity > maxScore) {
          maxScore = similarity
          bestMatch = char
        }
      })

      // Normalize match percentage to a fun [72%, 99%] range
      const pct = Math.floor(72 + maxScore * 27)

      setMatchedCharacter(bestMatch)
      setMatchPercentage(pct)
      setIsLoadingMatch(false)
      setIsQuizCompleted(true)

      // Update URL with results so it's shareable
      const params = new URLSearchParams()
      params.set("char", bestMatch.slug)
      params.set("pct", pct.toString())
      router.push(`/tools/which-character?${params.toString()}`, { scroll: false })
    }, 2800)
  }

  const handleRestartQuiz = () => {
    setCurrentQuestionIdx(0)
    setAnswers({
      stealth: 0,
      aggression: 0,
      street_smart: 0,
      tech_savvy: 0,
      loyalty: 0,
      chaos: 0
    })
    setMatchedCharacter(null)
    setMatchPercentage(0)
    setIsQuizCompleted(false)
    router.push("/tools/which-character", { scroll: false })
  }

  const handleCopyShareLink = () => {
    if (!matchedCharacter) return
    const shareUrl = `${window.location.origin}/tools/which-character?char=${matchedCharacter.slug}&pct=${matchPercentage}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const getShareText = () => {
    if (!matchedCharacter) return ""
    return `I got ${matchedCharacter.name} with a ${matchPercentage}% match on the GTA 6 Hub Character Quiz! Who are you? Take the quiz here:`
  }

  const getOgImageUrl = () => {
    if (!matchedCharacter) return ""
    return `/api/og?char=${encodeURIComponent(matchedCharacter.name)}&pct=${matchPercentage}`
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Intro state */}
      {!isQuizCompleted && !isLoadingMatch && currentQuestionIdx === 0 && (
        <div className="bg-card-bg/60 border border-card-border p-8 rounded-xl text-center space-y-6 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue" />
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-neon-pink/15 to-neon-blue/15 border border-neon-pink/40 rounded-full flex items-center justify-center mb-2">
            <Users className="w-8 h-8 text-neon-pink" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Who is your GTA 6 Alter-Ego?</h2>
            <p className="text-foreground/70 text-sm max-w-lg mx-auto mt-2 leading-relaxed">
              Answer 8 personality and action playstyle questions to discover which character from the Leonida criminal underground matches your operational profile.
            </p>
          </div>

          <div className="bg-white/5 border border-card-border/60 rounded-lg p-4 text-left space-y-2 max-w-md mx-auto">
            <div className="flex items-center space-x-2 text-xs font-bold text-neon-yellow">
              <Zap className="w-4 h-4" />
              <span>DYNAMIC CHARACTER MATCHING</span>
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">
              Our advanced algorithm queries the real-time Supabase character roster at query time and matches you based on semantic heuristics.
            </p>
          </div>

          <div>
            <button
              onClick={() => setCurrentQuestionIdx(0)}
              className="px-8 py-3.5 rounded-lg font-bold bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:brightness-110 transition-all shadow-lg shadow-neon-pink/20 text-sm"
            >
              Start Personality Quiz
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoadingMatch && (
        <div className="bg-card-bg/60 border border-card-border p-12 rounded-xl text-center space-y-8 backdrop-blur-sm shadow-xl min-h-[350px] flex flex-col justify-center items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-neon-pink/20 border-t-neon-pink rounded-full animate-spin" />
            <Sparkles className="w-6 h-6 text-neon-blue absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-white font-extrabold text-lg animate-pulse">{loadingText}</p>
            <p className="text-xs text-foreground/40">Comparing answer vectors to Leonida databases...</p>
          </div>
        </div>
      )}

      {/* Active Question state */}
      {!isQuizCompleted && !isLoadingMatch && (currentQuestionIdx > 0 || currentQuestionIdx < QUESTIONS.length) && (
        <div className="bg-card-bg/60 border border-card-border p-8 rounded-xl space-y-6 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-card-border" />
          {/* Progress Bar */}
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-neon-pink to-neon-blue h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIdx + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neon-blue uppercase tracking-widest">
              Question {currentQuestionIdx + 1} of {QUESTIONS.length}
            </span>
            <span className="text-xs text-foreground/40">
              {Math.round(((currentQuestionIdx + 1) / QUESTIONS.length) * 100)}% Complete
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-white leading-snug">
            {QUESTIONS[currentQuestionIdx].text}
          </h3>

          <div className="grid grid-cols-1 gap-4 pt-2">
            {QUESTIONS[currentQuestionIdx].options.map((option, idx) => {
              const letters = ["A", "B", "C", "D"]
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(option.traits)}
                  className="group flex items-start space-x-4 p-4 rounded-xl bg-background border border-card-border hover:border-neon-pink hover:bg-neon-pink/[0.02] text-left transition-all duration-200"
                >
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-card-bg border border-card-border text-sm font-black text-foreground/60 group-hover:border-neon-pink/40 group-hover:text-neon-pink transition-all">
                    {letters[idx]}
                  </span>
                  <span className="text-sm font-semibold text-foreground/80 group-hover:text-white transition-colors">
                    {option.text}
                  </span>
                </button>
              )
            })}
          </div>

          {currentQuestionIdx > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
                className="text-xs font-bold text-foreground/40 hover:text-white flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Page */}
      {isQuizCompleted && matchedCharacter && (
        <div className="bg-card-bg border border-card-border rounded-xl backdrop-blur-sm shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue p-6 text-center">
            <span className="text-[10px] font-black tracking-widest uppercase text-black/80 bg-white/80 px-2.5 py-1 rounded-full mb-1 inline-block">
              QUIZ COMPLETED
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Your GTA 6 Match is: {matchedCharacter.name}</h2>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
              {/* Profile Image Column */}
              <div className="md:col-span-2 flex flex-col items-center">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden border-2 border-neon-pink/50 bg-black flex items-center justify-center shadow-lg shadow-neon-pink/10">
                  {matchedCharacter.featured_image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={matchedCharacter.featured_image}
                      alt={matchedCharacter.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-20 h-20 text-neon-pink/30 animate-pulse" />
                  )}

                  <div className="absolute bottom-3 right-3 bg-black/90 border border-neon-pink text-neon-pink font-black text-xs px-3 py-1 rounded-md">
                    {matchPercentage}% Match
                  </div>
                </div>
              </div>

              {/* Character Details Column */}
              <div className="md:col-span-3 space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold tracking-wider text-neon-blue uppercase">
                    CRIMINAL SYNDICATE FILE
                  </span>
                  <span className="w-1.5 h-1.5 bg-neon-purple rounded-full" />
                  <span className="text-xs font-semibold text-foreground/50">
                    ACTIVE STATUS
                  </span>
                </div>

                <h3 className="text-3xl font-black text-white uppercase tracking-tight">
                  {matchedCharacter.name}
                </h3>

                <p className="text-sm text-foreground/80 leading-relaxed bg-white/[0.01] border border-white/5 p-4 rounded-lg">
                  {matchedCharacter.biography}
                </p>

                {matchedCharacter.stats_json && Object.keys(matchedCharacter.stats_json).length > 0 && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {Object.entries(matchedCharacter.stats_json).map(([key, value]) => (
                      <div key={key} className="bg-background border border-card-border/60 px-3.5 py-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-foreground/40 block mb-0.5">{key}</span>
                        <span className="text-xs font-extrabold text-white">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* OG Share Preview Block */}
            <div className="bg-background border border-card-border p-5 rounded-lg space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-neon-yellow">
                <Share2 className="w-4 h-4" />
                <span>DYNAMIC SOCIAL PREVIEW (OG IMAGE)</span>
              </div>
              <p className="text-xs text-foreground/60">
                A custom, high-fidelity card has been dynamically generated for this match using standard Vercel Satori imaging. Sharing this page on X (Twitter), Facebook, or WhatsApp will render the layout preview below:
              </p>

              <div className="border border-card-border rounded-lg overflow-hidden relative group max-w-xl mx-auto shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getOgImageUrl()}
                  alt="Dynamic OG Share Card"
                  className="w-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Link
                    href={getOgImageUrl()}
                    target="_blank"
                    className="px-4 py-2 bg-black border border-white text-xs font-bold text-white rounded-md hover:bg-white hover:text-black transition-colors"
                  >
                    Open Image in New Tab
                  </Link>
                </div>
              </div>
            </div>

            {/* Sharing / Actions Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-card-border">
              <button
                onClick={handleCopyShareLink}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3 border border-neon-blue text-neon-blue font-bold rounded-lg text-sm hover:bg-neon-blue/10 transition-all"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Copied link!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-4 h-4" />
                    <span>Copy Custom Share Link</span>
                  </>
                )}
              </button>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText() + " " + (typeof window !== "undefined" ? window.location.href : ""))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3 bg-neon-pink hover:brightness-110 text-white font-bold rounded-lg text-sm transition-all"
              >
                <span>Share on X (Twitter)</span>
              </a>

              <button
                onClick={handleRestartQuiz}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-card-border font-bold rounded-lg text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
