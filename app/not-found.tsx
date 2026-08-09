import React from "react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center px-4 py-24">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-neon-pink/10 blur-[80px] rounded-full pointer-events-none" />
      <h1 className="text-8xl font-extrabold text-neon-pink mb-4 tracking-wider select-none animate-pulse">
        404
      </h1>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
        Wasted. Page Not Found.
      </h2>
      <p className="text-foreground/60 max-w-md mx-auto mb-8">
        You&apos;ve run out of bounds or the requested resource doesn&apos;t exist in our Vice City index. Head back to safe territory!
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-md font-bold border border-neon-blue text-neon-blue hover:bg-neon-blue/10 transition-all duration-300 shadow-md shadow-neon-blue/15"
      >
        Go Home
      </Link>
    </div>
  )
}
