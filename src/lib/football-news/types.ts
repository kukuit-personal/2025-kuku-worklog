export type NewsType = 'transfer' | 'injury' | 'manager' | 'match' | 'general'

export interface FootballNewsItem {
  source: string
  title: string
  url: string
  publishedAt: string | null
  summary: string
  type: NewsType
  slug?: string
  hotScore?: number
}

export interface FootballFixtureItem {
  fixtureId: number | null
  league: string
  date: string | null
  status: string
  home: string
  away: string
  score: string
  title: string
}

export interface FootballNewsOutput {
  meta: {
    targetDate: string
    generatedAt: string
    totalNews: number
    totalFixtures: number
  }
  news: {
    all: FootballNewsItem[]
    transfer: FootballNewsItem[]
    match: FootballNewsItem[]
    injury: FootballNewsItem[]
    manager: FootballNewsItem[]
    general: FootballNewsItem[]
    top10: FootballNewsItem[]
  }
  fixtures: FootballFixtureItem[]
}
