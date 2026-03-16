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

export async function fetchRssFeed(feedUrl: string, source: string): Promise<FootballNewsItem[]> {
  const feed = await parser.parseURL(feedUrl)
  const items = Array.isArray(feed.items) ? feed.items : []

  return items.map((item) => {
    const publishedAt = toIsoSafe(item.isoDate || item.pubDate || null)
    const summary = stripHtml(item.contentSnippet || item.content || item.summary || '')

    return {
      source,
      title: item.title || '',
      url: item.link || '',
      publishedAt,
      summary,
      type: classifyNews(item.title || '', summary),
    }
  })
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

  return urls
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
      } satisfies FootballNewsItem
    })
    .filter((item) => item.title && item.url)
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
