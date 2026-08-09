import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const characterName = searchParams.get("char") || "Lucia"
    const percentage = searchParams.get("pct") || "95"

    // Neon colors matching Vice City vibe
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "linear-gradient(to bottom, #09090b, #18181b)",
            backgroundColor: "#09090b",
            fontFamily: "sans-serif",
            position: "relative",
            padding: "40px",
            border: "6px solid #ec4899", // Neon Pink border
          }}
        >
          {/* Subtle glowing radial background */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "600px",
              height: "600px",
              backgroundImage: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(59,130,246,0.15) 50%, transparent 100%)",
              borderRadius: "50%",
            }}
          />

          {/* Decorative Corner Lines */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              width: "40px",
              height: "40px",
              borderTop: "3px solid #3b82f6", // Neon Blue
              borderLeft: "3px solid #3b82f6",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "40px",
              height: "40px",
              borderTop: "3px solid #3b82f6",
              borderRight: "3px solid #3b82f6",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              width: "40px",
              height: "40px",
              borderBottom: "3px solid #3b82f6",
              borderLeft: "3px solid #3b82f6",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              width: "40px",
              height: "40px",
              borderBottom: "3px solid #3b82f6",
              borderRight: "3px solid #3b82f6",
            }}
          />

          {/* Logo / Subtitle */}
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "4px",
              color: "#3b82f6",
              marginBottom: "15px",
              textShadow: "0 0 10px rgba(59,130,246,0.5)",
            }}
          >
            GTA VI HUB CHARACTER QUIZ
          </div>

          {/* Main Question */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: 600,
              color: "#a1a1aa",
              marginBottom: "35px",
            }}
          >
            My GTA 6 Alter-Ego Match is...
          </div>

          {/* Matched Character Name */}
          <div
            style={{
              fontSize: "76px",
              fontWeight: 900,
              textTransform: "uppercase",
              backgroundImage: "linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6)",
              backgroundClip: "text",
              color: "#ffffff",
              marginBottom: "15px",
              textAlign: "center",
              letterSpacing: "2px",
            }}
          >
            {characterName}
          </div>

          {/* Match Score Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(236, 72, 153, 0.1)",
              border: "2px solid #ec4899",
              borderRadius: "50px",
              padding: "10px 30px",
              marginBottom: "50px",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#ec4899",
                letterSpacing: "1px",
              }}
            >
              COMPATIBILITY: {percentage}%
            </span>
          </div>

          {/* Footer branding */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#52525b",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            gta6-hub.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error: any) {
    console.error("OG Image generation failed:", error)
    return new Response(`Failed to generate image`, { status: 500 })
  }
}
