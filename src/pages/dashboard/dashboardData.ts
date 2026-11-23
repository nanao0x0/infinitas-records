import { lamps } from '../search/searchPresentation'
import type { CatalogSong } from '../search/songCatalog'
import type { ComparisonTab } from './dashboardPreferences'
export type Lamp = keyof typeof lamps
export type LampCounts = Record<Lamp, number>
export type VersionProgress = {
  name: string
  counts: LampCounts
  levels: LampCounts[]
}

export type DashboardTrack = {
  id: string
  title: string
  song: CatalogSong
  diff: string
  lv: number | null
  lamp: Lamp | null
  bp: number | null
  score: number | null
  plays: number | null
  lastPlay: string | null
  lastScoreUpdate: string | null
}

export type DashboardSongReference = Pick<DashboardTrack, 'song' | 'diff'>
export type OpenDashboardSong = (track: DashboardSongReference) => void

export type DashboardDifference = Pick<DashboardTrack, 'id' | 'title' | 'song' | 'diff' | 'lv'> & {
  lamp: { from: Lamp; to: Lamp } | null
  bp: { from: number; to: number } | null
  score: { from: number; to: number } | null
}

export type ComparisonSnapshot = { id: string; label: string; savedAt: number }
export type ComparisonPair = { fromId: string; toId: string }

export function resolveComparisonPair(snapshots: ComparisonSnapshot[], saved?: ComparisonPair): ComparisonPair | undefined {
  if (snapshots.length < 2) return undefined
  if (saved) {
    const from = snapshots.findIndex(({ id }) => id === saved.fromId)
    const to = snapshots.findIndex(({ id }) => id === saved.toId)
    if (to >= 0 && from > to) return saved
  }
  return { fromId: snapshots[1].id, toId: snapshots[0].id }
}

export type DashboardData = {
  snapshotLabel: string
  snapshotSavedAt: number | null
  comparisonSnapshots: ComparisonSnapshot[]
  trend: { label: string; counts: LampCounts; levels: LampCounts[] }[]
  levelClear: (LampCounts & { lv: number })[]
  lampCounts: LampCounts
  chartCount: number
  playedCount: number
  totalPlays: number
  playTendencyTop5: { lv: string; plays: number }[]
  versions: VersionProgress[]
  differences: DashboardDifference[]
  tracks: DashboardTrack[]
}

export const panelClass = 'min-w-0 rounded-md border border-zinc-200 bg-white transition-colors dark:border-zinc-700 dark:bg-zinc-800'
export const panelHeaderClass = 'flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700'
export const footerClass = 'flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[11px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-500'
export const rowsClass = 'flex-1 divide-y divide-zinc-200 dark:divide-zinc-700'

export const lampOrder = ['FC', 'EX_HARD', 'HARD', 'CLEAR', 'EASY', 'ASSIST', 'FAILED', 'NO_PLAY'] as const
export const lampColors: Record<Lamp, string> = {
  FC: '#d946ef', EX_HARD: '#f59e0b', HARD: '#dc2626', CLEAR: '#0891b2',
  EASY: '#16a34a', ASSIST: '#9333ea', FAILED: '#7f1d1d', NO_PLAY: '#a1a1aa',
}

export function lampLegendLabel(lamp: Lamp) {
  return lamp === 'CLEAR' ? 'CLEAR' : lamp === 'ASSIST' ? 'ASSIST' : lamps[lamp].label
}

export function emptyLampCounts(): LampCounts {
  return { FC: 0, EX_HARD: 0, HARD: 0, CLEAR: 0, EASY: 0, ASSIST: 0, FAILED: 0, NO_PLAY: 0 }
}

export const lampRank: Record<Lamp, number> = {
  NO_PLAY: 0, FAILED: 1, ASSIST: 2, EASY: 3, CLEAR: 4, HARD: 5, EX_HARD: 6, FC: 7,
}

function comparisonGain(entry: DashboardDifference, type: Exclude<ComparisonTab, 'all'>) {
  if (type === 'lamp') return entry.lamp ? lampRank[entry.lamp.to] - lampRank[entry.lamp.from] : 0
  if (type === 'bp') return entry.bp ? entry.bp.from - entry.bp.to : 0
  return entry.score ? entry.score.to - entry.score.from : 0
}

export function rankDifferences(differences: DashboardDifference[], tab: ComparisonTab) {
  const visible = tab === 'all' ? differences : differences.filter((entry) => entry[tab])
  return visible.toSorted((a, b) => {
    const byLevel = (b.lv ?? 0) - (a.lv ?? 0)
    if (byLevel) return byLevel
    if (tab !== 'all') return comparisonGain(b, tab) - comparisonGain(a, tab)
    return comparisonGain(b, 'lamp') - comparisonGain(a, 'lamp')
      || comparisonGain(b, 'bp') - comparisonGain(a, 'bp')
      || comparisonGain(b, 'score') - comparisonGain(a, 'score')
  })
}

export function clearedCount(counts: LampCounts) {
  return counts.ASSIST + counts.EASY + counts.CLEAR + counts.HARD + counts.EX_HARD + counts.FC
}

export function totalLampCount(counts: LampCounts) {
  return lampOrder.reduce((total, lamp) => total + counts[lamp], 0)
}

export function formatCount(value: number) {
  return value.toLocaleString('ja-JP')
}

export const levels = [{ value: 'ALL', label: '全レベル' },
  ...Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `Lv.${index + 1}` }))]

