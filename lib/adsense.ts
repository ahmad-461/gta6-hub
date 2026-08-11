/**
 * Helper to inject AdSense ad slots dynamically into HTML content.
 * Ad units are placed:
 * 1. First ad: placed after the first paragraph, unless that falls in the first 20%
 *    of the article. If so, we push it to the first paragraph at or after 20% (e.g. after paragraph 2 for 10 paragraphs).
 *    For very short articles (total paragraphs < 4), we skip the first ad entirely.
 * 2. Mid-article (after total_paragraphs / 2).
 * 3. End-of-article.
 */
export function injectAdSenseAds(content: string, publisherId: string | null): string {
  if (!publisherId || !content) return content

  // Split on </p> tags to count paragraphs
  const parts = content.split("</p>")

  // Remove empty trailing part if there is one
  if (parts.length > 1 && parts[parts.length - 1].trim() === "") {
    parts.pop()
  }

  const totalParagraphs = parts.length
  if (totalParagraphs === 0) return content

  // Reconstruct paragraphs with closing tags
  const paragraphs = parts.map((p) => p + "</p>")

  // Determine the paragraph index after which the first ad can be placed.
  // It must be at or after 20% of the paragraphs: P / totalParagraphs >= 0.20
  const firstAdMinParagraph = Math.ceil(0.20 * totalParagraphs)

  // Place after paragraph Math.max(1, firstAdMinParagraph).
  // (P is 1-based index of paragraph, i.e. 1, 2, 3...)
  const firstAdParaIndex = Math.max(1, firstAdMinParagraph)

  // Skip the first ad entirely for very short articles (less than 4 paragraphs)
  const showFirstAd = totalParagraphs >= 4

  const midIndex = Math.floor(totalParagraphs / 2)

  const adSlotFirst = `
    <div class="my-6 flex justify-center w-full adsense-slot" data-slot="after-first">
      <ins class="adsbygoogle"
           style="display:block; width:100%; text-align:center;"
           data-ad-client="${publisherId}"
           data-ad-slot="1111111111"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  `

  const adSlotMid = `
    <div class="my-6 flex justify-center w-full adsense-slot" data-slot="mid">
      <ins class="adsbygoogle"
           style="display:block; width:100%; text-align:center;"
           data-ad-client="${publisherId}"
           data-ad-slot="2222222222"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  `

  const adSlotEnd = `
    <div class="my-6 flex justify-center w-full adsense-slot" data-slot="end">
      <ins class="adsbygoogle"
           style="display:block; width:100%; text-align:center;"
           data-ad-client="${publisherId}"
           data-ad-slot="3333333333"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  `

  let result = ""
  for (let i = 0; i < totalParagraphs; i++) {
    result += paragraphs[i]

    // 1. First ad placement (after paragraph index: firstAdParaIndex - 1)
    if (showFirstAd && i === firstAdParaIndex - 1) {
      result += adSlotFirst
    }

    // 2. Mid-article (after midIndex - 1 paragraph)
    // Make sure we don't double up with the first ad
    if (i === midIndex - 1 && i !== firstAdParaIndex - 1 && i > 0 && midIndex > 0) {
      result += adSlotMid
    }
  }

  // 3. End of article
  result += adSlotEnd

  return result
}
