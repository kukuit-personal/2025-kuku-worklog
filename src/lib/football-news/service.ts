import dayjs from 'dayjs'
import { dedupeByTitle, isOnTargetDate, slugify } from './helpers'
import { fetchAllSources, fetchApiFootballFixturesByDate } from './fetchers'
import { scoreNews } from './scorers'
import type { FootballNewsItem, FootballNewsOutput } from './types'

export async function getFootballNewsByDate(targetDate: string): Promise<{
  data: FootballNewsOutput
  errors: string[]
}> {
  const { all, errors } = await fetchAllSources()

  const newsByDate = all.filter((item) => isOnTargetDate(item.publishedAt, targetDate))

  const enriched: FootballNewsItem[] = newsByDate.map((item) => ({
    ...item,
    slug: slugify(item.title),
    hotScore: scoreNews(item),
  }))

  const deduped = dedupeByTitle(enriched).sort((a, b) => {
    if ((b.hotScore || 0) !== (a.hotScore || 0)) {
      return (b.hotScore || 0) - (a.hotScore || 0)
    }

    return dayjs(b.publishedAt).valueOf() - dayjs(a.publishedAt).valueOf()
  })

  let fixtures: FootballNewsOutput['fixtures'] = []

  try {
    fixtures = await fetchApiFootballFixturesByDate(targetDate)
  } catch (error: any) {
    errors.push(error?.message || 'Failed to fetch fixtures')
  }

  const data: FootballNewsOutput = {
    meta: {
      targetDate,
      generatedAt: new Date().toISOString(),
      totalNews: deduped.length,
      totalFixtures: fixtures.length,
    },
    news: {
      all: deduped,
      transfer: deduped.filter((x) => x.type === 'transfer'),
      match: deduped.filter((x) => x.type === 'match'),
      injury: deduped.filter((x) => x.type === 'injury'),
      manager: deduped.filter((x) => x.type === 'manager'),
      general: deduped.filter((x) => x.type === 'general'),
      top10: deduped.slice(0, 10),
    },
    fixtures,
  }

  return { data, errors }
}
