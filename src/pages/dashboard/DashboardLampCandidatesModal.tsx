import { useId, useMemo } from 'react'
import { useSlideDialog } from '../../components/layout/useSlideDialog'
import type { PlayStyle } from '../../settings/playStyle'
import { lamps } from '../search/searchPresentation'
import { formatCount, type DashboardTrack, type OpenDashboardSong } from './dashboardData'
import { candidateSortOptions, type DashboardPreferences, type UpdateDashboardPreference } from './dashboardPreferences'
import { DashboardIcon, DifficultyBadge, LampBadge, PreviewSelect } from './dashboardPresentation'

const metricClass = 'pl-3 whitespace-nowrap'

export function DashboardLampCandidatesModal({ candidates, playStyle, preferences, bpLimit, updatePreference, onOpenSong, onClose }: {
  candidates: DashboardTrack[]
  playStyle: PlayStyle
  preferences: DashboardPreferences
  bpLimit: number
  updatePreference: UpdateDashboardPreference
  onOpenSong: OpenDashboardSong
  onClose: () => void
}) {
  const { dialogProps, requestClose } = useSlideDialog(onClose)
  const titleId = useId()
  const subtitleId = useId()
  const { candidateQuery, candidateSort, candidateLevel, targetLamp } = preferences
  const visible = useMemo(() => {
    const query = candidateQuery.normalize('NFKC').trim().toLowerCase()
    const matches = query ? candidates.filter(({ title }) => title.normalize('NFKC').toLowerCase().includes(query)) : candidates
    // The dashboard already orders candidates by BP.
    if (candidateSort === 'bp') return matches
    return matches.toSorted((a, b) => (b[candidateSort] ?? -1) - (a[candidateSort] ?? -1))
  }, [candidates, candidateQuery, candidateSort])

  return (
    <dialog {...dialogProps} aria-labelledby={titleId} aria-describedby={subtitleId}
      className="slide-dialog fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-md border border-zinc-200 bg-white font-dashboard shadow-2xl backdrop:bg-zinc-900/45 backdrop:backdrop-blur-sm md:max-w-[720px] dark:border-zinc-700 dark:bg-zinc-800 dark:backdrop:bg-black/70">
      <div className="flex max-h-[calc(85dvh-2px)] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <div>
            <h2 id={titleId} className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50">
              <DashboardIcon name="target" className="text-xl! text-red-500" />
              ランプ更新候補一覧
            </h2>
            <p id={subtitleId} className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {playStyle} / {candidateLevel === 'ALL' ? '全レベル' : `Lv.${candidateLevel}`} / {lamps[targetLamp].label}狙い / BP {formatCount(bpLimit)} 以下
            </p>
          </div>
          <button type="button" autoFocus aria-label="閉じる" onClick={requestClose}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700">
            <DashboardIcon name="close" className="text-xl!" />
          </button>
        </header>
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-900/40">
          <input type="search" aria-label="曲名で絞り込み" placeholder="曲名で絞り込み..." value={candidateQuery}
            onChange={(event) => updatePreference('candidateQuery', event.target.value)}
            className="min-w-[180px] flex-1 rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-800 focus:ring-2 focus:ring-zinc-400/50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
          <PreviewSelect label="候補の並び替え" options={candidateSortOptions} value={candidateSort} onChange={(value) => {
            const option = candidateSortOptions.find((item) => item.value === value)
            if (option) updatePreference('candidateSort', option.value)
          }} />
        </div>
        <div className="min-h-0 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-700">
          {visible.length === 0 && <p role="status" className="px-5 py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">一致する譜面がありません。</p>}
          {visible.map((track, index) => (
            <button key={`${track.id}:${index}`} type="button" aria-haspopup="dialog" onClick={() => onOpenSong(track)}
              className="flex w-full cursor-pointer flex-col items-start gap-2 px-5 py-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 sm:flex-row sm:items-center sm:gap-5 dark:hover:bg-zinc-700/30">
              <span className="flex min-w-0 items-center gap-2.5 sm:flex-1">
                <DifficultyBadge diff={track.diff} lv={track.lv} />
                <span className="min-w-0 text-sm font-bold wrap-anywhere text-zinc-900 dark:text-zinc-50">{track.title}</span>
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-500 tabular-nums sm:grid sm:shrink-0 sm:grid-cols-[3rem_6rem_4.5rem_4.5rem] dark:text-zinc-400">
                {track.lamp && <LampBadge lamp={track.lamp} />}
                <span className={metricClass}>スコア {track.score === null ? '—' : formatCount(track.score)}</span>
                <span className={metricClass}>{track.plays === null ? '—' : `${formatCount(track.plays)}回`}</span>
                <span className={`${metricClass} font-bold text-red-600 sm:text-right dark:text-red-400`}>BP {track.bp}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  )
}
