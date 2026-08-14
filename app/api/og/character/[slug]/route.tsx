import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "nodejs" // Using standard Node.js runtime for absolute reliability with Supabase SSR

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    // Query Supabase directly via standard REST API to avoid session/cookie edge issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-supabase-url.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy"

    const response = await fetch(
      `${supabaseUrl}/rest/v1/characters?slug=eq.${slug}&status=eq.published&select=name,stats_json`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        next: { revalidate: 60 }, // Cache response for 1 minute
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch character: ${response.statusText}`)
    }

    const data = await response.json()
    const char = data && data[0]

    const characterName = char?.name || "Unknown Asset"
    const stats = char?.stats_json || {}
    const role = stats.role || "Unknown"
    const affiliation = stats.affiliation || "None / Speculated"
    const status = stats.status || "Unverified"

    // Generates a 1200x630 Classified dossier folder style card image
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundImage: "linear-gradient(to bottom, #0B0B0F, #16161B)",
            backgroundColor: "#0B0B0F",
            fontFamily: "sans-serif",
            position: "relative",
            padding: "50px",
            border: "8px solid #FF2D8D", // Primary accent pink border
          }}
        >
          {/* Top Left Classified Stamp */}
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "40px",
              display: "flex",
              alignItems: "center",
              border: "2px solid #FF8A3D",
              color: "#FF8A3D",
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            RESTRICTED ACCESS
          </div>

          {/* Top Right System Grid */}
          <div
            style={{
              position: "absolute",
              top: "30px",
              right: "40px",
              display: "flex",
              color: "rgba(245,245,247,0.3)",
              fontSize: "12px",
              fontFamily: "monospace",
              letterSpacing: "1px",
            }}
          >
            SYS.ID // INTEL.REGISTRY_091
          </div>

          {/* Large classified folder tab styled layout */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "40px",
              flexGrow: 1,
            }}
          >
            {/* Tab Header Line */}
            <div
              style={{
                display: "flex",
                borderBottom: "2px solid rgba(245,245,247,0.14)",
                paddingBottom: "10px",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#FF2D8D",
                  color: "#0B0B0F",
                  padding: "6px 20px 4px 20px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              >
                CHARACTER PROFILE DOSSIER
              </div>
            </div>

            {/* Character Header */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "35px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  color: "#FF8A3D",
                  fontWeight: "bold",
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  marginBottom: "5px",
                }}
              >
                SUBJECT NAME:
              </span>
              <span
                style={{
                  fontSize: "56px",
                  fontWeight: "900",
                  color: "#F5F5F7",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  lineHeight: "1",
                }}
              >
                {characterName}
              </span>
            </div>

            {/* Structured Classified Stats Grid */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              {/* Role Card */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "#16161B",
                  border: "1px solid rgba(245,245,247,0.1)",
                  padding: "15px 25px",
                  minWidth: "250px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#FF8A3D",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                  }}
                >
                  ASSIGNED ROLE
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    color: "#F5F5F7",
                    fontWeight: "bold",
                  }}
                >
                  {role}
                </span>
              </div>

              {/* Affiliation Card */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "#16161B",
                  border: "1px solid rgba(245,245,247,0.1)",
                  padding: "15px 25px",
                  minWidth: "250px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#FF8A3D",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                  }}
                >
                  AFFILIATION
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    color: "#F5F5F7",
                    fontWeight: "bold",
                  }}
                >
                  {affiliation}
                </span>
              </div>

              {/* Status Card */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "#16161B",
                  border: "1px solid rgba(245,245,247,0.1)",
                  padding: "15px 25px",
                  minWidth: "250px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#FF8A3D",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                  }}
                >
                  INTELLIGENCE STATUS
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    color: "#F5F5F7",
                    fontWeight: "bold",
                  }}
                >
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Rotated DECLASSIFIED stamp graphic */}
          <div
            style={{
              position: "absolute",
              right: "60px",
              bottom: "120px",
              display: "flex",
              transform: "rotate(-12deg)",
              border: "4px dashed #FF8A3D",
              color: "#FF8A3D",
              padding: "8px 25px",
              fontSize: "28px",
              fontWeight: "900",
              letterSpacing: "5px",
              textTransform: "uppercase",
              borderRadius: "4px",
              opacity: 0.8,
            }}
          >
            DECLASSIFIED
          </div>

          {/* Footer branding */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(245,245,247,0.1)",
              paddingTop: "15px",
              fontSize: "12px",
              color: "#9E9EA8",
              letterSpacing: "2px",
            }}
          >
            <span style={{ fontWeight: "bold" }}>VICE CITY INTEL COMMAND</span>
            <span>gta6-hub-liard.vercel.app</span>
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
