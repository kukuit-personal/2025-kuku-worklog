import dayjs from 'dayjs'

export function stripHtml(input = ''): string {
  return String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeTitle(title = ''): string {
  return String(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugify(input = ''): string {
  return normalizeTitle(input).replace(/\s+/g, '-')
}

export function toIsoSafe(dateValue?: string | null): string | null {
  if (!dateValue) return null
  const d = dayjs(dateValue)
  return d.isValid() ? d.toISOString() : null
}

export function isOnTargetDate(isoString: string | null, targetDate: string): boolean {
  if (!isoString) return false
  return dayjs(isoString).format('YYYY-MM-DD') === targetDate
}

export function dedupeByTitle<T extends { title: string; summary?: string; hotScore?: number }>(
  items: T[]
): T[] {
  const map = new Map<string, T>()

  for (const item of items) {
    const key = normalizeTitle(item.title)

    if (!map.has(key)) {
      map.set(key, item)
      continue
    }

    const existing = map.get(key)!
    const existingScore = (existing.summary?.length || 0) + (existing.hotScore || 0)
    const currentScore = (item.summary?.length || 0) + (item.hotScore || 0)

    if (currentScore > existingScore) {
      map.set(key, item)
    }
  }

  return Array.from(map.values())
}
