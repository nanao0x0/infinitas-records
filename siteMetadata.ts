import type { Plugin } from 'vite'
import { navigation } from './src/navigation.ts'

const siteName = 'INFINITAS Records'
const imagePath = '/images/ogp.png'
const imageAlt = 'INFINITAS Records のロゴ'

type Page = (typeof navigation)[number]
const pageEntries: Record<Page['path'], string> = {
  '/': '/src/pages/dashboard/DashboardPage.tsx',
  '/search': '/src/pages/search/SearchPage.tsx',
  '/data': '/src/pages/data/DataPage.tsx',
}

function escapeMarkup(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function renderPage(template: string, page: Page, siteUrl?: URL, entryUrl?: string) {
  const canonical = siteUrl ? escapeMarkup(new URL(page.path, siteUrl).href) : undefined
  const image = siteUrl ? escapeMarkup(new URL(imagePath, siteUrl).href) : imagePath
  const title = escapeMarkup(page.seoTitle)
  const description = escapeMarkup(page.description)
  const structuredData = siteUrl && page.path === '/' ? JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl.href,
    inLanguage: 'ja',
  }).replaceAll('<', '\\u003c') : undefined

  const metadata = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    ...(canonical ? [`<link rel="canonical" href="${canonical}" />`] : []),
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="ja_JP" />',
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    ...(canonical ? [`<meta property="og:url" content="${canonical}" />`] : []),
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:type" content="image/png" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`,
    ...(structuredData ? [`<script type="application/ld+json">${structuredData}</script>`] : []),
  ].join('\n    ')
  const links = navigation.map(({ path, title }) => `<a href="${path}">${escapeMarkup(title)}</a>`).join(' ')
  const fallback = `<noscript><main><h1>${title}</h1><p>${description}</p><nav aria-label="メインナビゲーション">${links}</nav><p>アプリを使うには JavaScript を有効にしてください。</p></main></noscript>`
  const preload = entryUrl ? `<link rel="modulepreload" crossorigin href="${escapeMarkup(entryUrl)}" />` : ''
  return template
    .replace('<!-- page-metadata -->', () => metadata)
    .replace('<!-- page-entry-preload -->', () => preload)
    .replace('<!-- page-noscript -->', () => fallback)
}

export function siteMetadata(siteUrl?: URL): Plugin {
  let base = '/'
  return {
    name: 'site-metadata',
    configResolved(config) { base = config.base },
    transformIndexHtml(html, context) {
      if (!context.server) return html
      const pathname = new URL(context.originalUrl ?? context.path, 'http://localhost').pathname.replace(/\/$/, '') || '/'
      const page = navigation.find(({ path }) => path === pathname) ?? navigation[0]
      return renderPage(html, page)
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const index = bundle['index.html']
        if (index?.type !== 'asset' || typeof index.source !== 'string' || !index.source.includes('<!-- page-metadata -->')) {
          this.error('Could not find the site metadata template in index.html.')
        }
        const template = index.source
        function renderRoute(page: Page) {
          const entry = Object.values(bundle).find((chunk) => chunk.type === 'chunk' &&
            chunk.facadeModuleId?.replaceAll('\\', '/').endsWith(pageEntries[page.path]))
          if (!entry) throw new Error(`Page chunk missing for ${page.path}`)
          return renderPage(template, page, siteUrl, `${base}${entry.fileName}`)
        }
        index.source = renderRoute(navigation[0])
        // Cloudflare serves a flat search.html at the clean URL /search.
        for (const page of navigation.slice(1)) {
          this.emitFile({ type: 'asset', fileName: `${page.path.slice(1)}.html`, source: renderRoute(page) })
        }

        const sitemapUrl = siteUrl ? new URL('/sitemap.xml', siteUrl).href : undefined
        const robots = ['User-agent: *', 'Allow: /', ...(sitemapUrl ? [`Sitemap: ${sitemapUrl}`] : [])].join('\n')
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots}\n` })
        if (siteUrl) {
          const entries = navigation.map(({ path }) => `  <url><loc>${escapeMarkup(new URL(path, siteUrl).href)}</loc></url>`)
          const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...entries, '</urlset>', ''].join('\n')
          this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
        }
      },
    },
  }
}
