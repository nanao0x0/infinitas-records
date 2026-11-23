import { useEffect, useId, useRef, useState } from 'react'
import { useSlideDialog } from '../../components/layout/useSlideDialog'
import { textFontStylesReady } from '../../components/layout/textFonts'
import type { PlayStyle } from '../../settings/playStyle'
import type { DashboardDifference } from './dashboardData'
import type { ComparisonTab } from './dashboardPreferences'
import { DashboardIcon } from './dashboardPresentation'
import { drawDashboardShareImage, shareFocusOptions, shareImageHeight, shareImageWidth } from './dashboardShareImage'

const filenameDate = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit' })

export function DashboardShareModal({ playStyle, comparisonLabel, comparisonEnd, differences, isDark, focus, onFocusChange, onClose }: {
  playStyle: PlayStyle
  comparisonLabel: string
  comparisonEnd: number
  differences: DashboardDifference[]
  isDark: boolean
  focus: ComparisonTab
  onFocusChange: (focus: ComparisonTab) => void
  onClose: () => void
}) {
  const { dialogProps, requestClose } = useSlideDialog(onClose)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const titleId = useId()
  const selectId = useId()
  const [downloadFailed, setDownloadFailed] = useState(false)

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    let active = true
    const draw = () => drawDashboardShareImage(context, { isDark, playStyle, comparisonLabel, focus, differences })
    draw()
    void textFontStylesReady.then(async () => {
      if (!active) return
      draw()
      await document.fonts.ready
      if (active) draw()
    })
    return () => { active = false }
  }, [comparisonLabel, differences, focus, isDark, playStyle])

  async function download() {
    setDownloadFailed(false)
    await document.fonts.ready
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      if (!canvas.getContext('2d')) throw new Error('Canvas is unavailable')
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `infinitas_update_${playStyle}_${filenameDate.format(comparisonEnd).replaceAll('-', '')}.png`
      link.click()
    } catch {
      setDownloadFailed(true)
    }
  }

  return (
    <dialog {...dialogProps} aria-labelledby={titleId}
      className="slide-dialog fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-md border border-zinc-200 bg-white font-dashboard shadow-2xl backdrop:bg-zinc-900/45 backdrop:backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800 dark:backdrop:bg-black/70">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
        <h2 id={titleId} className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
          <DashboardIcon name="image" className="text-xl! text-zinc-600 dark:text-zinc-300" />
          SNS共有用リザルト画像
        </h2>
        <button type="button" autoFocus aria-label="閉じる" onClick={requestClose}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700">
          <DashboardIcon name="close" className="text-xl!" />
        </button>
      </header>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={selectId} className="text-xs font-bold text-zinc-600 dark:text-zinc-300">中心に表示するデータ:</label>
          <div className="relative">
            <select id={selectId} value={focus} onChange={(event) => {
              const option = shareFocusOptions.find(({ value }) => value === event.target.value)
              if (option) onFocusChange(option.value)
            }} className="cursor-pointer appearance-none rounded-sm border border-zinc-200 bg-zinc-50 py-1.5 pr-8 pl-3 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 focus:ring-2 focus:ring-zinc-400/50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600">
              {shareFocusOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            <DashboardIcon name="expand_more" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-base! text-zinc-400" />
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-900 dark:border-zinc-700">
          <canvas ref={canvasRef} width={shareImageWidth} height={shareImageHeight} role="img"
            aria-label={`${playStyle} ${comparisonLabel} の更新レポートのプレビュー`} className="block h-auto w-full" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">※ 選択中の比較区間・強調データで1200×630pxの画像を生成します。</p>
          <button type="button" onClick={() => void download()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm bg-zinc-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            <DashboardIcon name="download" className="text-base!" />PNG画像をダウンロード
          </button>
        </div>
        {downloadFailed && <p role="alert" className="text-xs text-red-700 dark:text-red-400">PNG画像を生成できませんでした。</p>}
      </div>
    </dialog>
  )
}
