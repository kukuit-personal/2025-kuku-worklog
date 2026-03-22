import dayjs from 'dayjs'
import { BIG_CLUBS, HOT_KEYWORDS } from './constants'
import type { FootballNewsItem, NewsType } from './types'

export function classifyNews(title = '', summary = ''): NewsType {
  const text = `${title} ${summary}`.toLowerCase()

  if (
    /transfer|bid|target|interest|deal|move|loan|sign|signing|medical|contract|release clause|clause/.test(
      text
    )
  ) {
    return 'transfer'
  }

  if (/injury|injured|out for|absence|ruled out|fitness|setback|recovery/.test(text)) {
    return 'injury'
  }

  if (/manager|coach|sacked|appointed|appointment|job|future|pressure/.test(text)) {
    return 'manager'
  }

  if (/result|win|defeat|draw|thrash|beats|edge|late goal|comeback|fightback/.test(text)) {
    return 'match'
  }

  return 'general'
}

export function scoreNews(item: FootballNewsItem): number {
  const text = `${item.title} ${item.summary}`.toLowerCase()
  let score = 0

  for (const club of BIG_CLUBS) {
    if (text.includes(club)) score += 3
  }

  for (const kw of HOT_KEYWORDS) {
    if (text.includes(kw)) score += 2
  }

  if (item.publishedAt) {
    const hoursOld = Math.abs(dayjs().diff(dayjs(item.publishedAt), 'hour'))
    if (hoursOld <= 6) score += 4
    else if (hoursOld <= 12) score += 3
    else if (hoursOld <= 24) score += 2
  }

  if (item.source === 'BBC Sport') score += 2
  if (item.source === 'Sky Sports') score += 2
  if (item.source === 'ESPN') score += 2

  return score
}
