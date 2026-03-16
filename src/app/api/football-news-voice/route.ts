import dayjs from 'dayjs'
import { NextRequest, NextResponse } from 'next/server'
import { getFootballNewsByDate } from '@/lib/football-news/service'
import { generateVoiceTextV2 } from '@/lib/football-news/voice'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || dayjs().subtract(1, 'day').format('YYYY-MM-DD')

    const { data, errors } = await getFootballNewsByDate(date)
    const voice = generateVoiceTextV2(data)

    return NextResponse.json({
      ok: true,
      data,
      voice,
      errors,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || 'Failed to generate football voice text',
      },
      { status: 500 }
    )
  }
}
