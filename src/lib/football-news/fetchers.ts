import axios from 'axios'
import Parser from 'rss-parser'
import { XMLParser } from 'fast-xml-parser'
import { FEEDS } from './constants'
import { stripHtml, toIsoSafe } from './helpers'
import { classifyNews } from './scorers'
import type { FootballFixtureItem, FootballNewsItem } from './types'

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (football-news-bot)',
  },
})

function collectImageUrls(input: any): string[] {
  const results: string[] = []

  function visit(value: any) {
    if (!value) return

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (/^https?:\/\//i.test(trimmed)) results.push(trimmed)
      return
    }

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    if (typeof value === 'object') {
      if (typeof value.url === 'string') visit(value.url)
      if (typeof value.link === 'string') visit(value.link)
      if (typeof value.href === 'string') visit(value.href)
      if (typeof value['@_url'] === 'string') visit(value['@_url'])
      if (typeof value['media:content'] !== 'undefined') visit(value['media:content'])
      if (typeof value['media:thumbnail'] !== 'undefined') visit(value['media:thumbnail'])
      if (typeof value['media:group'] !== 'undefined') visit(value['media:group'])

      Object.values(value).forEach(visit)
    }
  }

  visit(input)
  return results
}

function extractImageUrlsFromHtml(html = ''): string[] {
  const matches = Array.from(
    html.matchAll(/<img[^>]+src=["'](https?:\/\/[^"'<>]+)["'][^>]*>/gi),
    (match) => match[1]
  )

  return matches
}

function uniqueImageUrls(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const output: string[] = []

  for (const value of values) {
    const trimmed = String(value || '').trim()
    if (!/^https?:\/\//i.test(trimmed)) continue
    if (seen.has(trimmed)) continue

    seen.add(trimmed)
    output.push(trimmed)

    if (output.length >= 3) break
  }

  return output
}

function extractRssImages(item: any): string[] {
  return uniqueImageUrls([
    ...collectImageUrls(item.enclosure),
    ...collectImageUrls(item.image),
    ...collectImageUrls(item.thumbnail),
    ...collectImageUrls(item['media:content']),
    ...collectImageUrls(item['media:thumbnail']),
    ...collectImageUrls(item['media:group']),
    ...collectImageUrls(item.itunes),
    ...extractImageUrlsFromHtml(item.content || ''),
    ...extractImageUrlsFromHtml(item['content:encoded'] || ''),
  ])
}

async function fetchOgImages(articleUrl: string): Promise<string[]> {
  if (!articleUrl) return []

  try {
    const response = await axios.get<string>(articleUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (football-news-bot)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    const html = response.data || ''
    const ogMatches = Array.from(
      html.matchAll(
        /<meta[^>]+property=["']og:image(?::(?:secure_)?url)?["'][^>]+content=["']([^"']+)["'][^>]*>/gi
      ),
      (match) => match[1]
    )
    const twitterMatches = Array.from(
      html.matchAll(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi),
      (match) => match[1]
    )

    return uniqueImageUrls([...ogMatches, ...twitterMatches])
  } catch {
    return []
  }
}

async function enrichImages(items: FootballNewsItem[]): Promise<FootballNewsItem[]> {
  const enriched = await Promise.all(
    items.map(async (item) => {
      const currentImages = uniqueImageUrls(item.images || [])

      if (currentImages.length >= 3) {
        return {
          ...item,
          images: currentImages,
        }
      }

      const fallbackImages = await fetchOgImages(item.url)

      return {
        ...item,
        images: uniqueImageUrls([...currentImages, ...fallbackImages]),
      }
    })
  )

  return enriched
}

export async function fetchRssFeed(feedUrl: string, source: string): Promise<FootballNewsItem[]> {
  const feed = await parser.parseURL(feedUrl)
  const items = Array.isArray(feed.items) ? feed.items : []

  const mapped = items.map((item: any) => {
    const publishedAt = toIsoSafe(item.isoDate || item.pubDate || null)
    const summary = stripHtml(item.contentSnippet || item.content || item.summary || '')

    return {
      source,
      title: item.title || '',
      url: item.link || '',
      publishedAt,
      summary,
      type: classifyNews(item.title || '', summary),
      images: extractRssImages(item),
    }
  })

  return enrichImages(mapped)
}

export async function fetchSkySitemap(sitemapUrl: string): Promise<FootballNewsItem[]> {
  const response = await axios.get<string>(sitemapUrl, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (football-news-bot)',
      Accept: 'application/xml,text/xml,*/*',
    },
  })

  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: true,
  })

  const parsed = xmlParser.parse(response.data)
  const rows = parsed?.urlset?.url || []
  const urls = Array.isArray(rows) ? rows : [rows]

  const mapped = urls
    .map((row: any) => {
      const newsNode = row['news:news'] || {}
      const title = newsNode['news:title'] || ''
      const publishedAt = toIsoSafe(newsNode['news:publication_date'] || null)
      const url = row.loc || ''

      return {
        source: 'Sky Sports',
        title,
        url,
        publishedAt,
        summary: '',
        type: classifyNews(title, ''),
        images: [],
      } satisfies FootballNewsItem
    })
    .filter((item) => item.title && item.url)

  return enrichImages(mapped)
}

export async function fetchAllSources() {
  const tasks = [
    fetchRssFeed(FEEDS.bbc.url, FEEDS.bbc.source),
    fetchRssFeed(FEEDS.espn.url, FEEDS.espn.source),
    fetchSkySitemap(FEEDS.sky.url),
  ]

  const results = await Promise.allSettled(tasks)

  const all: FootballNewsItem[] = []
  const errors: string[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      all.push(...result.value)
    } else {
      errors.push(result.reason?.message || String(result.reason))
    }
  }

  return { all, errors }
}

export async function fetchApiFootballFixturesByDate(
  dateStr: string
): Promise<FootballFixtureItem[]> {
  const apiKey = process.env.API_FOOTBALL_KEY?.trim()
  if (!apiKey || apiKey === 'YOUR_API_KEY') return []

  const url = 'https://v3.football.api-sports.io/fixtures'
  const response = await axios.get(url, {
    timeout: 20000,
    params: { date: dateStr },
    headers: {
      'x-apisports-key': apiKey,
    },
  })

  const rows = response.data?.response || []

  return rows.map((row: any) => {
    const home = row?.teams?.home?.name || ''
    const away = row?.teams?.away?.name || ''
    const hg = row?.goals?.home
    const ag = row?.goals?.away
    const status = row?.fixture?.status?.short || ''
    const league = row?.league?.name || ''
    const fixtureDate = toIsoSafe(row?.fixture?.date || null)

    return {
      fixtureId: row?.fixture?.id || null,
      league,
      date: fixtureDate,
      status,
      home,
      away,
      score: `${hg ?? '-'}-${ag ?? '-'}`,
      title: `${home} ${hg ?? '-'}-${ag ?? '-'} ${away}`,
    }
  })
}
