const SITE_NAME = 'TechPulse'
const DEFAULT_DESCRIPTION = 'Shop premium smartphones, smartwatches, audio gear, gaming consoles, and appliances at TechPulse. Authentic products, competitive prices, and warranty on every order.'
const DEFAULT_IMAGE = '/logo-full.png'

export interface SeoOptions {
  title: string
  description?: string
  keywords?: string
  image?: string
  type?: 'website' | 'product'
  robots?: string
  jsonLd?: Record<string, any> | null
}

function setMetaByAttr(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

const JSON_LD_ID = 'seo-json-ld'
function setJsonLd(data: Record<string, any> | null | undefined) {
  const existing = document.getElementById(JSON_LD_ID)
  if (!data) {
    existing?.remove()
    return
  }
  const script = existing ?? document.createElement('script')
  script.id = JSON_LD_ID
  script.setAttribute('type', 'application/ld+json')
  script.textContent = JSON.stringify(data)
  if (!existing) document.head.appendChild(script)
}

export function useSeo(options: SeoOptions) {
  const title = options.title.includes(SITE_NAME) ? options.title : `${options.title} | ${SITE_NAME}`
  const description = options.description || DEFAULT_DESCRIPTION
  const image = options.image ? new URL(options.image, window.location.origin).href : new URL(DEFAULT_IMAGE, window.location.origin).href
  const url = window.location.origin + window.location.pathname
  const robots = options.robots || 'index, follow'

  document.title = title

  setMetaByAttr('name', 'description', description)
  setMetaByAttr('name', 'robots', robots)
  if (options.keywords) setMetaByAttr('name', 'keywords', options.keywords)

  setMetaByAttr('property', 'og:title', title)
  setMetaByAttr('property', 'og:description', description)
  setMetaByAttr('property', 'og:type', options.type || 'website')
  setMetaByAttr('property', 'og:site_name', SITE_NAME)
  setMetaByAttr('property', 'og:image', image)
  setMetaByAttr('property', 'og:url', url)

  setMetaByAttr('name', 'twitter:card', 'summary_large_image')
  setMetaByAttr('name', 'twitter:title', title)
  setMetaByAttr('name', 'twitter:description', description)
  setMetaByAttr('name', 'twitter:image', image)

  setCanonical(url)
  setJsonLd(options.jsonLd)
}
