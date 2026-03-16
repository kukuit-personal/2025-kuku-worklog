import type { FootballNewsItem, FootballNewsOutput } from './types'

function viShortenClub(name: string): string {
  return name
    .replace('Manchester United', 'MU')
    .replace('Manchester City', 'Man City')
    .replace('Tottenham Hotspur', 'Tottenham')
    .replace('Newcastle United', 'Newcastle')
    .replace('Nottingham Forest', 'Nottingham')
    .replace('Wolverhampton Wanderers', 'Wolverhampton')
    .replace('Brighton and Hove Albion', 'Brighton')
    .replace('Paris Saint Germain', 'PSG')
}

function buildHook(data: FootballNewsOutput): string {
  if (data.fixtures.length >= 3) return 'Rực lửa sân cỏ, chuyển nhượng cũng bùng nổ.'
  if (data.news.transfer.length >= 2) return 'Thị trường chuyển nhượng nóng lên từng giờ.'
  return 'Loạt diễn biến nóng nhất của bóng đá hôm nay.'
}

function buildFixtureSentence(home: string, away: string, score: string): string {
  return `${viShortenClub(home)} hòa hoặc thắng ${viShortenClub(away)} với tỉ số ${score}.`
}

function simplifyHeadline(item: FootballNewsItem): string {
  const title = item.title.replace(/\s+/g, ' ').trim()

  if (item.source === 'BBC Sport') return `BBC tiết lộ: ${title}.`
  if (item.source === 'Sky Sports') return `Sky Sports cho biết: ${title}.`
  if (item.source === 'ESPN') return `ESPN cập nhật: ${title}.`

  return `${title}.`
}

export function generateVoiceTextV2(data: FootballNewsOutput) {
  const [year, month, day] = data.meta.targetDate.split('-')
  const intro = `Bản tin bóng đá sáng ${day} tháng ${month}.`
  const hook = buildHook(data)

  const matchLines = data.fixtures.slice(0, 5).map((item) => {
    return buildFixtureSentence(item.home, item.away, item.score)
  })

  const newsLines = data.news.top10.slice(0, 5).map((item) => simplifyHeadline(item))

  const outro = 'Cám ơn bạn đã xem tin một-chín-chín-mươi-ết.'

  const fullText = [intro, hook, ...matchLines, ...newsLines, outro].join('\n')

  return {
    intro,
    hook,
    matchLines,
    newsLines,
    outro,
    fullText,
  }
}
