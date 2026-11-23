import { useEffect, useRef } from 'react'
import { CategoryScale, Chart, Filler, LinearScale, LineController, LineElement, PointElement, Tooltip } from 'chart.js'
import type { ScorePoint } from './useSongHistory'

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Filler, Tooltip)

const date = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
})

export function ScoreHistoryChart({ points, lightColor, darkColor }: {
  points: ScorePoint[]
  lightColor: string
  darkColor: string
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const best = Math.max(...points.map(({ score }) => score))

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const dark = Boolean(element.closest('.dark'))
    const color = dark ? darkColor : lightColor
    const chart = new Chart(element, {
      type: 'line',
      data: {
        labels: points.map(({ savedAt }) => date.format(savedAt)),
        datasets: [
          { label: 'スコア', data: points.map(({ score }) => score), borderColor: color, backgroundColor: `${color}30`, borderWidth: 2, pointRadius: points.length === 1 ? 4 : 2, pointHoverRadius: 5, fill: true },
          { label: 'BEST', data: points.map(() => best), borderColor: dark ? '#52525b' : '#cbd5e1', borderDash: [4, 4], borderWidth: 1, pointRadius: 0 },
        ],
      },
      options: {
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { display: false, offset: points.length === 1 },
          y: { display: false, grace: '12%' },
        },
        plugins: { tooltip: { filter: ({ datasetIndex }) => datasetIndex === 0 } },
      },
    })
    return () => chart.destroy()
  }, [points, best, lightColor, darkColor])

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>過去スコア推移（{points.length}件）</span>
        <span className="font-bold tabular-nums" style={{ color: lightColor }}><span className="dark:hidden">BEST: {best.toLocaleString('ja-JP')}</span><span className="hidden dark:inline" style={{ color: darkColor }}>BEST: {best.toLocaleString('ja-JP')}</span></span>
      </div>
      <div className="rounded-md border border-zinc-200 bg-white p-3 sm:p-3.5 dark:border-zinc-700/70 dark:bg-zinc-800">
        <div className="relative h-32 w-full sm:h-36">
          <canvas ref={canvas} role="img" aria-label={`保存日時別のスコア推移。最高スコア ${best.toLocaleString('ja-JP')}`} />
        </div>
        <div className="mt-1.5 flex justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <span>{date.format(points[0].savedAt)}</span>
          {points.length > 1 && <span>{date.format(points[points.length - 1].savedAt)}</span>}
        </div>
      </div>
    </>
  )
}
