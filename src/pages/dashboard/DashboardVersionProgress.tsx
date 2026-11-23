import { useCallback, useId, useState } from 'react'
import { useSlideDialog } from '../../components/layout/useSlideDialog'
import type { PlayStyle } from '../../settings/playStyle'
import { clearedCount, footerClass, lampLegendLabel, lampOrder, levels, panelClass, totalLampCount, type LampCounts, type VersionProgress } from './dashboardData'
import { getLampColors } from './dashboardLampColors'
import { DashboardIcon, PanelTitle, PreviewSelect } from './dashboardPresentation'

function VersionLampLegend({ isDark }: { isDark: boolean }) {
  const lampColors = getLampColors(isDark)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      {lampOrder.map((lamp) => (
        <span key={lamp} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: lampColors[lamp] }} />
          {lampLegendLabel(lamp)}
        </span>
      ))}
    </div>
  )
}

function VersionProgressBar({ name, counts, isDark }: { name: string; counts: LampCounts; isDark: boolean }) {
  const lampColors = getLampColors(isDark)
  const total = totalLampCount(counts)
  const cleared = clearedCount(counts)
  const breakdown = lampOrder.map((lamp) => `${lampLegendLabel(lamp)} ${counts[lamp]}譜面`).join('、')
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-bold text-zinc-800 dark:text-zinc-100" title={name}>{name}</span>
        <span className="shrink-0 text-zinc-500 tabular-nums dark:text-zinc-400">
          {total > 0 ? <>クリア率 <strong className="text-zinc-800 dark:text-zinc-100">{Math.round(cleared / total * 100)}%</strong> ({cleared}/{total})</> : '対象譜面なし'}
        </span>
      </div>
      {total > 0 && (
        <div role="img" aria-label={`${name}のランプ内訳、${breakdown}`}
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
          {lampOrder.filter((lamp) => counts[lamp] > 0).map((lamp) => {
            const percent = counts[lamp] / total * 100
            return <span key={lamp} className="shrink-0" style={{ width: `${percent}%`, backgroundColor: lampColors[lamp] }}
              title={`${lampLegendLabel(lamp)} ${percent.toFixed(1)}%（${counts[lamp]}譜面）`} />
          })}
        </div>
      )}
    </div>
  )
}

type VersionProgressProps = {
  versions: VersionProgress[]
  playStyle: PlayStyle
  isDark: boolean
  level: string
  onLevelChange: (level: string) => void
}

function VersionProgressModal({ versions, playStyle, isDark, level, onLevelChange, onClose }: VersionProgressProps & {
  onClose: () => void
}) {
  const { dialogProps, requestClose } = useSlideDialog(onClose)
  const titleId = useId()
  const levelId = useId()
  const levelIndex = Number(level) - 1
  return (
    <dialog {...dialogProps} aria-labelledby={titleId}
      className="slide-dialog fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-md border border-zinc-200 bg-white font-dashboard shadow-2xl backdrop:bg-zinc-900/45 backdrop:backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800 dark:backdrop:bg-black/70">
      <div className="flex max-h-[calc(85dvh-2px)] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <div>
            <h2 id={titleId} className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
              <DashboardIcon name="library_music" className="text-xl! text-indigo-500" />
              バージョン別クリア進捗（全バージョン・レベル別）
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {playStyle} / 全{versions.length}バージョン / {level === 'ALL' ? '全レベル合計' : `Lv.${level}`}
            </p>
          </div>
          <button type="button" autoFocus aria-label="閉じる" onClick={requestClose}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700">
            <DashboardIcon name="close" className="text-xl!" />
          </button>
        </header>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <label htmlFor={levelId} className="text-xs font-bold text-zinc-600 dark:text-zinc-300">表示レベル:</label>
            <PreviewSelect id={levelId} label="表示レベル" options={levels} value={level} onChange={onLevelChange} />
          </div>
          <VersionLampLegend isDark={isDark} />
        </div>
        <div className="grid min-h-0 grid-cols-1 gap-x-6 gap-y-4 overflow-y-auto p-5 md:grid-cols-2">
          {versions.map(({ name, counts, levels }) => (
            <VersionProgressBar key={name} name={name} counts={level === 'ALL' ? counts : levels[levelIndex]} isDark={isDark} />
          ))}
        </div>
      </div>
    </dialog>
  )
}

export function DashboardVersionProgress(props: VersionProgressProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const closeDetails = useCallback(() => setDetailsOpen(false), [])
  const visible = props.versions.slice(0, 8)
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <PanelTitle title="バージョン別クリア進捗" icon="library_music" color="text-indigo-500" description="収録バージョンごとのクリアランプ構成割合" />
          <VersionLampLegend isDark={props.isDark} />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
          {visible.map(({ name, counts }) => <VersionProgressBar key={name} name={name} counts={counts} isDark={props.isDark} />)}
        </div>
        {visible.length === 0 && <p className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">バージョン別のデータがありません。</p>}
      </div>
      <div className={footerClass}>
        <span>{visible.length} バージョンを表示中</span>
        <button type="button" aria-haspopup="dialog" disabled={!visible.length} onClick={() => setDetailsOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 enabled:cursor-pointer enabled:hover:underline disabled:opacity-50 dark:text-sky-400">
          全バージョン・レベル別詳細を表示
          <DashboardIcon name="open_in_new" className="text-sm!" />
        </button>
      </div>
      {detailsOpen && visible.length > 0 && <VersionProgressModal {...props} onClose={closeDetails} />}
    </section>
  )
}
