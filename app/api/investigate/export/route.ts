import { NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

// Wrap text utility to manually wrap lines for pdf-lib text drawing
function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  // Replace carriage returns and split by newline
  const paragraphs = text.replace(/\r/g, "").split("\n")
  const lines: string[] = []

  for (const para of paragraphs) {
    if (para.trim().length === 0) {
      lines.push("")
      continue
    }

    const words = para.split(" ")
    let currentLine = ""

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, fontSize)

      if (width < maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question, answer, sources, similarityScore } = body

    if (!question || !answer) {
      return NextResponse.json({ error: "Missing required query or answer fields." }, { status: 400 })
    }

    // Create a new PDF Document
    const pdfDoc = await PDFDocument.create()

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier)

    // Colors mapping to Hex / rgb standard
    // Ink-2 #16161B => RGB(0.08, 0.05, 0.12)
    // Magenta #FF2D8D => RGB(1.0, 0.18, 0.53)
    // Orange #FF8A3D => RGB(0.0, 0.9, 1.0)
    // Paper-dim #9E9EA8 => RGB(0.61, 0.56, 0.68)
    const ink2Color = rgb(0.08, 0.05, 0.12)
    const magentaColor = rgb(1.0, 0.176, 0.553)
    const orangeColor = rgb(1.0, 0.54, 0.24)
    const paperDimColor = rgb(0.61, 0.56, 0.68)

    let page = pdfDoc.addPage([612, 792]) // Standard US Letter size
    let { width, height } = page.getSize()

    let yPosition = height - 50

    // Draw page decorator helper (left accent line, header)
    const drawPageDecoration = (pg: any, isFirstPage = false) => {
      // Draw left vertical accent lines
      pg.drawRectangle({
        x: 35,
        y: 40,
        width: 3,
        height: height - 80,
        color: magentaColor,
      })

      pg.drawRectangle({
        x: 42,
        y: 40,
        width: 1,
        height: height - 80,
        color: orangeColor,
        opacity: 0.5,
      })

      // Header text
      pg.drawText("GTA 6 HUB // INTEL TERMINAL CODENAME: INVESTIGATOR", {
        x: 55,
        y: height - 35,
        size: 8,
        font: courierFont,
        color: paperDimColor,
      })

      pg.drawText("CONFIDENTIAL // CASE DOSSIER", {
        x: width - 210,
        y: height - 35,
        size: 8,
        font: courierFont,
        color: magentaColor,
      })

      // Horizontal line under header
      pg.drawLine({
        start: { x: 35, y: height - 42 },
        end: { x: width - 35, y: height - 42 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      })

      // Footer
      pg.drawLine({
        start: { x: 35, y: 45 },
        end: { x: width - 35, y: 45 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      })

      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      pg.drawText(`EXPORTED: ${dateStr.toUpperCase()}  |  gta6-hub-liard.vercel.app`, {
        x: 55,
        y: 32,
        size: 7,
        font: courierFont,
        color: paperDimColor,
      })

      pg.drawText("RESTRICTED DIRECTORY FILE", {
        x: width - 170,
        y: 32,
        size: 7,
        font: courierFont,
        color: magentaColor,
      })
    }

    // Init first page decoration
    drawPageDecoration(page, true)
    yPosition -= 20

    // Title Block
    page.drawText("INTELLIGENCE DOSSIER REPORT", {
      x: 55,
      y: yPosition,
      size: 16,
      font: helveticaBold,
      color: ink2Color,
    })
    yPosition -= 22

    // Confidence badge calculation
    let confidenceLabel = "UNVERIFIED / EXTRAPOLATED"
    let scoreNum = similarityScore ? parseFloat(similarityScore) : 0.45
    if (scoreNum > 0.7) {
      confidenceLabel = "CONFIRMED ALIGNMENT"
    } else if (scoreNum >= 0.5) {
      confidenceLabel = "LIKELY MATCHES"
    }

    page.drawText(`VERIFICATION METRICS: ${confidenceLabel} (${Math.round(scoreNum * 100)}% SIMILARITY)`, {
      x: 55,
      y: yPosition,
      size: 9,
      font: courierFont,
      color: magentaColor,
    })
    yPosition -= 20

    // Question Box
    page.drawRectangle({
      x: 55,
      y: yPosition - 40,
      width: width - 90,
      height: 45,
      color: rgb(0.96, 0.94, 0.98),
      borderColor: rgb(0.9, 0.85, 0.92),
      borderWidth: 1,
    })

    page.drawText("SUBMITTED INQUIRY KEYWORDS:", {
      x: 65,
      y: yPosition - 12,
      size: 8,
      font: courierFont,
      color: paperDimColor,
    })

    const wrappedQuestion = wrapText(`"${question}"`, width - 110, 10, helveticaBold)
    page.drawText(wrappedQuestion[0] || "", {
      x: 65,
      y: yPosition - 28,
      size: 10,
      font: helveticaBold,
      color: ink2Color,
    })
    yPosition -= 55

    // Dossier Content Header
    page.drawText("ANALYSIS STATEMENT:", {
      x: 55,
      y: yPosition,
      size: 9,
      font: courierFont,
      color: magentaColor,
    })
    yPosition -= 15

    // Wrap the response text (remove markdown bracket links for clean PDF reading)
    const cleanedAnswer = answer.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    const wrappedAnswer = wrapText(cleanedAnswer, width - 90, 10, helveticaFont)

    // Render Answer paragraphs, handling multi-page overflows
    for (const line of wrappedAnswer) {
      if (yPosition < 75) {
        // Create new page
        page = pdfDoc.addPage([612, 792])
        drawPageDecoration(page)
        yPosition = height - 70
      }

      if (line === "") {
        yPosition -= 8 // spacer between paragraphs
        continue
      }

      page.drawText(line, {
        x: 55,
        y: yPosition,
        size: 9.5,
        font: helveticaFont,
        color: ink2Color,
        lineHeight: 14,
      })
      yPosition -= 14
    }

    yPosition -= 20

    // Sources and Evidence section
    if (sources && Array.isArray(sources) && sources.length > 0) {
      if (yPosition < 110) {
        page = pdfDoc.addPage([612, 792])
        drawPageDecoration(page)
        yPosition = height - 70
      }

      page.drawText("VERIFIED TELEMETRY SOURCES:", {
        x: 55,
        y: yPosition,
        size: 9,
        font: courierFont,
        color: magentaColor,
      })
      yPosition -= 15

      for (const src of sources) {
        if (yPosition < 75) {
          page = pdfDoc.addPage([612, 792])
          drawPageDecoration(page)
          yPosition = height - 70
        }

        // Draw a neat source item
        page.drawRectangle({
          x: 55,
          y: yPosition - 18,
          width: width - 90,
          height: 22,
          color: rgb(0.98, 0.98, 1.0),
          borderColor: rgb(0.9, 0.9, 0.92),
          borderWidth: 0.5,
        })

        page.drawText(`[*] ${src.title || "Classified Walkthrough Record"}`, {
          x: 65,
          y: yPosition - 12,
          size: 8.5,
          font: helveticaBold,
          color: ink2Color,
        })

        const typeLabel = src.type ? src.type.toUpperCase() : "INTEL"
        page.drawText(`[${typeLabel}]`, {
          x: width - 110,
          y: yPosition - 12,
          size: 7.5,
          font: courierFont,
          color: paperDimColor,
        })

        yPosition -= 28
      }
    }

    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes)

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="gta6_case_file_intel.pdf"',
      },
    })
  } catch (error: any) {
    console.error("PDF Export failed:", error)
    return NextResponse.json({ error: "Failed to generate case file PDF: " + error.message }, { status: 500 })
  }
}
