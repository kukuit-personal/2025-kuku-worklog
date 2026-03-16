'use client'

import { useEffect, useMemo, useState } from 'react'

type ApiResponse = {
  ok: boolean
  data?: any
  voice?: {
    fullText: string
    intro: string
    hook: string
    matchLines: string[]
    newsLines: string[]
    outro: string
  }
  errors?: string[]
  message?: string
}

export default function FootballNewsPage() {
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  })

  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState<ApiResponse | null>(null)
  const [tab, setTab] = useState<'news' | 'voice'>('voice')

  async function fetchData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/football-news-voice?date=${date}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      setPayload(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const topNews = useMemo(() => payload?.data?.news?.top10 || [], [payload])
  const fixtures = useMemo(() => payload?.data?.fixtures || [], [payload])

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Football News Bot</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lấy tin bóng đá theo ngày và generate voice text.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2"
          />
          <button
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Fetch news'}
          </button>

          <button
            onClick={() => setTab('voice')}
            className={`rounded-xl px-4 py-2 ${
              tab === 'voice' ? 'bg-blue-600 text-white' : 'border border-slate-300'
            }`}
          >
            Voice
          </button>

          <button
            onClick={() => setTab('news')}
            className={`rounded-xl px-4 py-2 ${
              tab === 'news' ? 'bg-blue-600 text-white' : 'border border-slate-300'
            }`}
          >
            News
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

      {tab === 'voice' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Voice text V2</h2>
          <textarea
            readOnly
            value={payload?.voice?.fullText || ''}
            className="mt-4 min-h-[420px] w-full rounded-2xl border border-slate-300 p-4 text-sm outline-none"
          />
        </div>
      ) : null}

      {tab === 'news' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Top news</h2>
            <div className="mt-4 space-y-3">
              {topNews.map((item: any, idx: number) => (
                <div key={`${item.slug}-${idx}`} className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">
                    {item.source} • score {item.hotScore}
                  </div>
                  <div className="mt-1 font-medium text-slate-900">{item.title}</div>
                  <a
                    href={item.url}
                    target="_blank"
                    className="mt-2 inline-block text-sm text-blue-600"
                  >
                    Open source
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Fixtures</h2>
            <div className="mt-4 space-y-3">
              {fixtures.length ? (
                fixtures.slice(0, 10).map((item: any, idx: number) => (
                  <div
                    key={`${item.fixtureId}-${idx}`}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="text-xs text-slate-500">{item.league}</div>
                    <div className="mt-1 font-medium text-slate-900">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-600">Status: {item.status}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">
                  Chưa có fixture. Thêm API_FOOTBALL_KEY để lấy dữ liệu trận đấu.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
