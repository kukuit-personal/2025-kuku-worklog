import dayjs from 'dayjs'
import { NextRequest, NextResponse } from 'next/server'
import { getFootballNewsByDate } from '@/lib/football-news/service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    const timeFrom = searchParams.get('timeFrom') || undefined
    const timeTo = searchParams.get('timeTo') || undefined

    const { data, errors } = await getFootballNewsByDate(date, { timeFrom, timeTo })

    return NextResponse.json({
      ok: true,
      data,
      errors,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || 'Failed to fetch football news',
      },
      { status: 500 }
    )
  }
}
