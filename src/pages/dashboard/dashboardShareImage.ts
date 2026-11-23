import type { PlayStyle } from '../../settings/playStyle'
import { difficulties, lamps } from '../search/searchPresentation'
import { lampRank, rankDifferences, type DashboardDifference } from './dashboardData'
import type { ComparisonTab } from './dashboardPreferences'

export const shareImageWidth = 1200
export const shareImageHeight = 630

export const shareFocusOptions = [
  { value: 'all', label: '総合（ランプ・BP・スコア）', caption: '総合' },
  { value: 'lamp', label: 'ランプ更新中心', caption: 'ランプ更新中心' },
  { value: 'bp', label: 'BP減少中心', caption: 'BP減少中心' },
  { value: 'score', label: 'スコア更新中心', caption: 'スコア更新中心' },
] as const

const metrics = [
  { key: 'lamp', label: 'ランプ更新', color: '#dc2626' },
  { key: 'bp', label: 'BP減少', color: '#059669' },
  { key: 'score', label: 'スコア更新', color: '#0284c7' },
] as const

const difficultyColors: Record<string, string> = {
  BEGINNER: '#4d7c0f', NORMAL: '#0284c7', HYPER: '#d97706', ANOTHER: '#dc2626', LEGGENDARIA: '#9333ea',
}

function fitTitle(ctx: CanvasRenderingContext2D, title: string, width: number) {
  if (ctx.measureText(title).width <= width) return title
  const characters = Array.from(title)
  while (characters.length && ctx.measureText(characters.join('') + '...').width > width) characters.pop()
  return characters.join('') + '...'
}

export function drawDashboardShareImage(ctx: CanvasRenderingContext2D, { isDark, playStyle, comparisonLabel, focus, differences }: {
  isDark: boolean
  playStyle: PlayStyle
  comparisonLabel: string
  focus: ComparisonTab
  differences: DashboardDifference[]
}) {
  const background = isDark ? '#18181b' : '#f4f4f5'
  const card = isDark ? '#27272a' : '#ffffff'
  const border = isDark ? '#3f3f46' : '#e4e4e7'
  const foreground = isDark ? '#f4f4f5' : '#18181b'
  const muted = isDark ? '#a1a1aa' : '#71717a'

  function box(x: number, y: number, width: number, height: number, radius: number, color: string, borderWidth = 0) {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.fillStyle = color
    ctx.fill()
    if (borderWidth) {
      ctx.strokeStyle = border
      ctx.lineWidth = borderWidth
      ctx.stroke()
    }
  }

  function setText(size: number, color: string) {
    ctx.fillStyle = color
    ctx.font = `700 ${size}px "Noto Sans", "Noto Sans JP", sans-serif`
  }

  ctx.fillStyle = background
  ctx.fillRect(0, 0, shareImageWidth, shareImageHeight)
  box(28, 28, 1144, 574, 14, card, 2)
  setText(40, foreground)
  ctx.fillText('beatmania IIDX INFINITAS 更新レポート', 60, 92)
  setText(22, muted)
  const caption = shareFocusOptions.find(({ value }) => value === focus)?.caption
  ctx.fillText(`${playStyle}  |  ${comparisonLabel}  |  ${caption}`, 60, 130)

  metrics.forEach(({ key, label, color }, index) => {
    const x = 60 + index * 368
    const count = differences.filter((entry) => entry[key]).length
    box(x, 154, 344, 54, 8, background, 1.5)
    box(x + 14, 166, 12, 30, 4, color)
    setText(23, foreground)
    ctx.fillText(`${label} ${count}件`, x + 40, 189)
  })

  const rows = rankDifferences(differences, focus).slice(0, 4)
  if (!rows.length) {
    setText(26, muted)
    ctx.fillText('選択された条件に該当する更新はありません。', 60, 320)
    return
  }

  rows.forEach(({ title, diff, lv, lamp, bp, score }, index) => {
    const y = 230 + index * 92
    const difficulty = difficulties.find(({ name }) => name === diff)
    box(60, y, 1080, 82, 10, background, 1.5)
    box(78, y + 18, 72, 46, 6, difficultyColors[diff] ?? '#71717a')
    setText(22, '#ffffff')
    ctx.fillText(`${difficulty?.key ?? ''}${lv ?? '?'}`, 92, y + 49)

    const firstClear = lamp?.from === 'NO_PLAY' && lampRank[lamp.to] > lampRank.FAILED
    const labels = {
      score: score && `+${score.to - score.from}`,
      bp: bp && `${bp.from}→${bp.to}`,
      lamp: lamp && (firstClear ? lamps[lamp.to].label : `${lamps[lamp.from].label}→${lamps[lamp.to].label}`),
    }
    let right = 1122
    for (const { key, color } of [...metrics].reverse()) {
      const label = labels[key]
      if (!label) continue
      setText(20, '#ffffff')
      const width = ctx.measureText(label).width + 28
      right -= width
      box(right, y + 18, width, 46, 6, color)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, right + 14, y + 49)
      right -= 12
    }

    setText(28, foreground)
    ctx.fillText(fitTitle(ctx, title, right - 176), 168, y + 51)
  })
}
