'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronsRight } from 'lucide-react'
import dayjs from 'dayjs'
import type {
  FootballFixtureItem,
  FootballNewsItem,
  FootballNewsOutput,
} from '@/lib/football-news/types'

type VoicePayload = {
  fullText: string
  intro: string
  hook: string
  matchLines: string[]
  newsLines: string[]
  outro: string
}

type NewsApiResponse = {
  ok: boolean
  data?: FootballNewsOutput
  errors?: string[]
  message?: string
}

type VoiceApiResponse = {
  ok: boolean
  voice?: VoicePayload
  message?: string
}

type SourceTab = 'bbc' | 'espn' | 'sky' | 'fixtures'

type SelectedNewsItem = {
  kind: 'news'
  sourceLabel: 'bbc' | 'espn' | 'sky'
  key: string
  item: FootballNewsItem
}

type SelectedFixtureItem = {
  kind: 'fixture'
  sourceLabel: 'fixtures'
  key: string
  item: FootballFixtureItem
}

type SelectedItem = SelectedNewsItem | SelectedFixtureItem

const TAB_LABELS: Record<SourceTab, string> = {
  bbc: 'BBC Sport',
  espn: 'ESPN',
  sky: 'Sky Sports',
  fixtures: 'Fixtures',
}

const NEWS_SOURCE_MAP: Record<'bbc' | 'espn' | 'sky', string> = {
  bbc: 'BBC Sport',
  espn: 'ESPN',
  sky: 'Sky Sports',
}

const TIME_OPTIONS = Array.from({ length: 25 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)

function buildNewsKey(sourceLabel: 'bbc' | 'espn' | 'sky', item: FootballNewsItem) {
  return `${sourceLabel}:${item.slug || item.title}:${item.url}`
}

function buildFixtureKey(item: FootballFixtureItem) {
  return `fixtures:${item.fixtureId ?? item.title}:${item.date ?? 'no-date'}`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'No date'
  const parsed = dayjs(value)
  if (!parsed.isValid()) return 'No date'
  return parsed.format('DD/MM/YYYY HH:mm')
}

function NewsImagePreview({ item }: { item: FootballNewsItem }) {
  const images = item.images || []
  const cover = images[0]

  if (!cover) return null

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <img src={cover} alt={item.title} className="h-40 w-full object-cover" loading="lazy" />
      {images.length > 1 ? (
        <div className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
          {images.length} images available
        </div>
      ) : null}
    </div>
  )
}

function buildVoiceInput(baseData: FootballNewsOutput, selectedItems: SelectedItem[]): FootballNewsOutput {
  const selectedNews = selectedItems
    .filter((entry): entry is SelectedNewsItem => entry.kind === 'news')
    .map((entry) => entry.item)

  const selectedFixtures = selectedItems
    .filter((entry): entry is SelectedFixtureItem => entry.kind === 'fixture')
    .map((entry) => entry.item)

  return {
    ...baseData,
    meta: {
      ...baseData.meta,
      totalNews: selectedNews.length,
      totalFixtures: selectedFixtures.length,
    },
    news: {
      all: selectedNews,
      transfer: selectedNews.filter((item) => item.type === 'transfer'),
      match: selectedNews.filter((item) => item.type === 'match'),
      injury: selectedNews.filter((item) => item.type === 'injury'),
      manager: selectedNews.filter((item) => item.type === 'manager'),
      general: selectedNews.filter((item) => item.type === 'general'),
      top10: selectedNews.slice(0, 10),
    },
    fixtures: selectedFixtures,
  }
}

export default function FootballNewsPage() {
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [timeFrom, setTimeFrom] = useState('00:00')
  const [timeTo, setTimeTo] = useState('24:00')

  const [newsLoading, setNewsLoading] = useState(false)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [payload, setPayload] = useState<NewsApiResponse | null>(null)
  const [voice, setVoice] = useState<VoicePayload | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SourceTab>('bbc')
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  async function fetchNews() {
    try {
      setNewsLoading(true)
      setVoice(null)
      setVoiceError(null)
      setSelectedItems([])

      const params = new URLSearchParams({
        date,
        timeFrom,
        timeTo,
      })
      const res = await fetch(`/api/football-news?${params.toString()}`, {
        cache: 'no-store',
      })
      const json: NewsApiResponse = await res.json()
      setPayload(json)
    } finally {
      setNewsLoading(false)
    }
  }

  async function generateVoice() {
    if (!payload?.ok || !payload.data || !selectedItems.length) return

    try {
      setVoiceLoading(true)
      setVoiceError(null)

      const res = await fetch('/api/football-news-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: buildVoiceInput(payload.data, selectedItems),
        }),
      })
      const json: VoiceApiResponse = await res.json()

      if (!json.ok || !json.voice) {
        setVoice(null)
        setVoiceError(json.message || 'Failed to generate voice text')
        return
      }

      setVoice(json.voice)
    } finally {
      setVoiceLoading(false)
    }
  }

  const newsItems = payload?.data?.news?.all || []
  const fixtureItems = payload?.data?.fixtures || []

  const itemsByTab = useMemo(
    () => ({
      bbc: newsItems.filter((item) => item.source === NEWS_SOURCE_MAP.bbc),
      espn: newsItems.filter((item) => item.source === NEWS_SOURCE_MAP.espn),
      sky: newsItems.filter((item) => item.source === NEWS_SOURCE_MAP.sky),
      fixtures: fixtureItems,
    }),
    [fixtureItems, newsItems]
  )

  const selectedKeys = useMemo(() => new Set(selectedItems.map((item) => item.key)), [selectedItems])

  const leftTabItems = useMemo(() => {
    if (activeTab === 'fixtures') {
      return itemsByTab.fixtures
        .map((item) => ({
          key: buildFixtureKey(item),
          item,
        }))
        .filter((entry) => !selectedKeys.has(entry.key))
    }

    return itemsByTab[activeTab]
      .map((item) => ({
        key: buildNewsKey(activeTab, item),
        item,
      }))
      .filter((entry) => !selectedKeys.has(entry.key))
  }, [activeTab, itemsByTab, selectedKeys])

  function moveOne(entry: SelectedItem) {
    setSelectedItems((current) => {
      if (current.some((item) => item.key === entry.key)) return current
      return [...current, entry]
    })
    setVoice(null)
    setVoiceError(null)
  }

  function moveAllFromTab() {
    const entries: SelectedItem[] =
      activeTab === 'fixtures'
        ? leftTabItems.map((entry) => ({
            kind: 'fixture',
            sourceLabel: 'fixtures',
            key: entry.key,
            item: entry.item as FootballFixtureItem,
          }))
        : leftTabItems.map((entry) => ({
            kind: 'news',
            sourceLabel: activeTab,
            key: entry.key,
            item: entry.item as FootballNewsItem,
          }))

    setSelectedItems((current) => {
      const currentKeys = new Set(current.map((item) => item.key))
      const newEntries = entries.filter((item) => !currentKeys.has(item.key))
      return [...current, ...newEntries]
    })
    setVoice(null)
    setVoiceError(null)
  }

  function removeSelected(key: string) {
    setSelectedItems((current) => current.filter((item) => item.key !== key))
    setVoice(null)
    setVoiceError(null)
  }

  function removeAllSelected() {
    setSelectedItems([])
    setVoice(null)
    setVoiceError(null)
  }

  const canGenerateVoice = Boolean(payload?.ok && payload.data && selectedItems.length)

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Football News Bot</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fetch news, pick the items you want to keep, then generate voice from the selected list.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2"
          />
          <select
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={`from-${time}`} value={time}>
                {time}
              </option>
            ))}
          </select>
          <select
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={`to-${time}`} value={time}>
                {time}
              </option>
            ))}
          </select>
          <button
            onClick={fetchNews}
            disabled={newsLoading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {newsLoading ? 'Loading...' : 'Fetch news'}
          </button>
        </div>
      </div>

      {payload?.errors?.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {payload.errors.map((item, idx) => (
            <div key={idx}>- {item}</div>
          ))}
        </div>
      ) : null}

      {voiceError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {voiceError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(TAB_LABELS) as SourceTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-sm ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 text-slate-700'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{TAB_LABELS[activeTab]}</h2>
              <p className="text-sm text-slate-500">
                {leftTabItems.length} unselected items in this tab.
              </p>
            </div>

            <button
              onClick={moveAllFromTab}
              disabled={!leftTabItems.length}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
            >
              <ChevronsRight className="h-4 w-4" />
              Move all
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {leftTabItems.map((entry) => (
              <div key={entry.key} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                <div className="min-w-0 flex-1">
                  {activeTab === 'fixtures' ? (
                    <>
                      <div className="text-xs text-slate-500">
                        {(entry.item as FootballFixtureItem).league}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDateTime((entry.item as FootballFixtureItem).date)}
                      </div>
                      <div className="mt-1 font-medium text-slate-900">
                        {(entry.item as FootballFixtureItem).title}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Status: {(entry.item as FootballFixtureItem).status}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-slate-500">
                        {(entry.item as FootballNewsItem).source} - score{' '}
                        {(entry.item as FootballNewsItem).hotScore}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDateTime((entry.item as FootballNewsItem).publishedAt)}
                      </div>
                      <div className="mt-1 font-medium text-slate-900">
                        {(entry.item as FootballNewsItem).title}
                      </div>
                      {(entry.item as FootballNewsItem).summary ? (
                        <div className="mt-2 line-clamp-3 text-sm text-slate-600">
                          {(entry.item as FootballNewsItem).summary}
                        </div>
                      ) : null}
                      <NewsImagePreview item={entry.item as FootballNewsItem} />
                      <a
                        href={(entry.item as FootballNewsItem).url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm text-blue-600"
                      >
                        Open source
                      </a>
                    </>
                  )}
                </div>

                <button
                  onClick={() =>
                    moveOne(
                      activeTab === 'fixtures'
                        ? {
                            kind: 'fixture',
                            sourceLabel: 'fixtures',
                            key: entry.key,
                            item: entry.item as FootballFixtureItem,
                          }
                        : {
                            kind: 'news',
                            sourceLabel: activeTab,
                            key: entry.key,
                            item: entry.item as FootballNewsItem,
                          }
                    )
                  }
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"
                  aria-label="Move to right"
                  title="Move to right"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}

            {!leftTabItems.length && !newsLoading ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No items available in this tab.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Selected items</h2>
              <p className="text-sm text-slate-500">
                Review the selected items here before generating voice.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {selectedItems.length} selected
              </div>
              <button
                onClick={removeAllSelected}
                disabled={!selectedItems.length}
                className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
              >
                Remove all
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {selectedItems.map((entry) => (
              <div key={entry.key} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                <div className="min-w-0 flex-1">
                  {entry.kind === 'fixture' ? (
                    <>
                      <div className="text-xs text-slate-500">{entry.item.league}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDateTime(entry.item.date)}
                      </div>
                      <div className="mt-1 font-medium text-slate-900">{entry.item.title}</div>
                      <div className="mt-1 text-sm text-slate-600">Status: {entry.item.status}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-slate-500">
                        {entry.item.source} - score {entry.item.hotScore}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDateTime(entry.item.publishedAt)}
                      </div>
                      <div className="mt-1 font-medium text-slate-900">{entry.item.title}</div>
                      {entry.item.summary ? (
                        <div className="mt-2 line-clamp-3 text-sm text-slate-600">{entry.item.summary}</div>
                      ) : null}
                      <NewsImagePreview item={entry.item} />
                      <a
                        href={entry.item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm text-blue-600"
                      >
                        Open source
                      </a>
                    </>
                  )}
                </div>

                <button
                  onClick={() => removeSelected(entry.key)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white"
                  aria-label="Move to left"
                  title="Move to left"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            ))}

            {!selectedItems.length ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No items have been moved to the right yet.
              </div>
            ) : null}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <button
              onClick={generateVoice}
              disabled={!canGenerateVoice || voiceLoading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white disabled:opacity-50"
            >
              {voiceLoading ? 'Generating...' : 'Generate voice from selected items'}
            </button>
          </div>

          {voice ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-base font-semibold text-slate-900">Voice text V2</h3>
              <textarea
                readOnly
                value={voice.fullText}
                className="mt-3 min-h-[320px] w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm outline-none"
              />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
