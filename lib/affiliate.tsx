/**
 * Helper to parse custom <AffiliateLink> tags or standard data-affiliate links in content
 * and replace them with standard styled anchor tags.
 */
export function parseAffiliateLinks(content: string): { parsedContent: string; hasAffiliate: boolean } {
  if (!content) return { parsedContent: content, hasAffiliate: false }

  let hasAffiliate = false
  let parsedContent = content

  // 1. Detect if has affiliate links
  if (
    content.includes("<AffiliateLink") ||
    content.includes("data-affiliate") ||
    content.includes('class="affiliate-link"') ||
    content.includes("class='affiliate-link'")
  ) {
    hasAffiliate = true
  }

  // 2. Parse and replace <AffiliateLink href="URL" text="TEXT" /> or <AffiliateLink href="URL" text="TEXT"></AffiliateLink>
  const selfClosingRegex = /<AffiliateLink\s+href="([^"]+)"\s+text="([^"]+)"\s*(?:\/>|>\s*<\/AffiliateLink>)/g
  parsedContent = parsedContent.replace(selfClosingRegex, (match, href, text) => {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="affiliate-link text-neon-blue hover:text-neon-blue/80 font-bold underline inline-flex items-center gap-1">🛍️ ${text}</a>`
  })

  // Support <AffiliateLink href="URL">TEXT</AffiliateLink>
  const openRegex = /<AffiliateLink\s+href="([^"]+)"\s*>(.*?)<\/AffiliateLink>/g
  parsedContent = parsedContent.replace(openRegex, (match, href, text) => {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="affiliate-link text-neon-blue hover:text-neon-blue/80 font-bold underline inline-flex items-center gap-1">🛍️ ${text}</a>`
  })

  // 3. Style existing anchors with data-affiliate or affiliate-link class
  const anchorRegex = /<a\s+([^>]*href="[^"]+"[^>]*)>/g
  parsedContent = parsedContent.replace(anchorRegex, (match, attributes) => {
    if (attributes.includes("data-affiliate") || attributes.includes("affiliate-link")) {
      let newAttributes = attributes
      if (!attributes.includes('target="_blank"')) newAttributes += ' target="_blank"'
      if (!attributes.includes('rel=')) newAttributes += ' rel="noopener noreferrer nofollow"'

      return `<a ${newAttributes} class="affiliate-link text-neon-blue hover:text-neon-blue/80 font-bold underline inline-flex items-center gap-1">🛍️ `
    }
    return match
  })

  return { parsedContent, hasAffiliate }
}
export function AffiliateLink({ href, text }: { href: string; text: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="affiliate-link text-neon-blue hover:text-neon-blue/80 font-bold underline inline-flex items-center gap-1"
    >
      🛍️ {text}
    </a>
  )
}
