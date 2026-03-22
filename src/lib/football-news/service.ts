import dayjs from 'dayjs'
import { dedupeByTitle, isOnTargetDate, slugify } from './helpers'
import { fetchAllSources, fetchApiFootballFixturesByDate } from './fetchers'
import { scoreNews } from './scorers'
import type { FootballNewsItem, FootballNewsOutput } from './types'

function isWithinTimeRange(
  value: string | null,
  targetDate: string,
  timeFrom?: string,
  timeTo?: string
): boolean {
  if (!value) return false

  const current = dayjs(value)
  if (!current.isValid()) return false
  if (current.format('YYYY-MM-DD') !== targetDate) return false

  if (!timeFrom && !timeTo) return true

  const start =
    timeFrom === '24:00'
      ? dayjs(`${targetDate}T23:59:59.999`)
      : dayjs(`${targetDate}T${timeFrom || '00:00'}`)
  const end =
    timeTo === '24:00'
      ? dayjs(`${targetDate}T23:59:59.999`)
      : dayjs(`${targetDate}T${timeTo || '23:59'}`)

  if (!start.isValid() || !end.isValid()) return true
  if (end.isBefore(start)) return current.isSame(start) || current.isAfter(start)

  return (current.isSame(start) || current.isAfter(start)) && (current.isSame(end) || current.isBefore(end))
}

export async function getFootballNewsByDate(
  targetDate: string,
  options?: {
    timeFrom?: string
    timeTo?: string
  }
): Promise<{
  data: FootballNewsOutput
  errors: string[]
}> {
  const { all, errors } = await fetchAllSources()
  const { timeFrom, timeTo } = options || {}

  const newsByDate = all.filter((item) =>
    timeFrom || timeTo
      ? isWithinTimeRange(item.publishedAt, targetDate, timeFrom, timeTo)
      : isOnTargetDate(item.publishedAt, targetDate)
  )

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
    const allFixtures = await fetchApiFootballFixturesByDate(targetDate)
    fixtures =
      timeFrom || timeTo
        ? allFixtures.filter((item) => isWithinTimeRange(item.date, targetDate, timeFrom, timeTo))
        : allFixtures
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
