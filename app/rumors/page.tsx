"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RumorsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/intelligence")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[50vh] font-mono text-xs text-foreground/40">
      REDIRECTING TO INTELLIGENCE COMMAND CENTER...
    </div>
  )
}
