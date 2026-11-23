import { DIFFICULTY_KEYS, MUSIC_OPTIONS } from '../../../data/versions/constants'
import type { CatalogSong } from './songCatalog'

export const chartFlags = ['CN', 'HCN', 'BSS', 'HBSS', 'MSS', 'SOF-LAN'] as const
export type ChartFlag = (typeof chartFlags)[number]
export type FlagValue = 'any' | 'yes' | 'no'
export type Range = { min: string; max: string }
export type SearchTarget = 'title' | 'artist'

export type SongFilters = {
  versions: string[]
  difficulties: string[]
  levels: string[]
  lamps: string[]
  flags: Partial<Record<ChartFlag, FlagValue>>
  bpm: Range
  bp: Range
}

export const defaultFilters: SongFilters = {
  versions: [], difficulties: [], levels: [], lamps: [], flags: {},
  bpm: { min: '', max: '' }, bp: { min: '', max: '' },
}

function limits(range: Range) {
  return {
    min: range.min === '' ? -Infinity : Number(range.min),
    max: range.max === '' ? Infinity : Number(range.max),
  }
}

export function filterSongs(songs: CatalogSong[], filters: SongFilters, target: SearchTarget, keyword: string) {
  const query = keyword.normalize('NFKC').trim().toLowerCase()
  const bpmActive = filters.bpm.min !== '' || filters.bpm.max !== ''
  const bpActive = filters.bp.min !== '' || filters.bp.max !== ''
  const bpm = limits(filters.bpm)
  const bp = limits(filters.bp)
  const flags = chartFlags.filter((flag) => filters.flags[flag] && filters.flags[flag] !== 'any')
  const chartActive = Boolean(filters.difficulties.length || filters.levels.length || filters.lamps.length || flags.length || bpActive)
  if (bpm.min > bpm.max || bp.min > bp.max) return []
  if (!query && !filters.versions.length && !bpmActive && !chartActive) return songs

  return songs.filter((song) => {
    if (query && !song[target].normalize('NFKC').toLowerCase().includes(query)) return false
    if (filters.versions.length && !song.versionIds.some((id) => filters.versions.includes(id))) return false
    if (bpmActive) {
      const ranges = [song.bpmRange, ...song.charts.map((chart) => chart?.bpmRange)].filter((range) => range !== undefined)
      if (!ranges.length || Math.max(...ranges.map(({ min, max }) => max ?? min)) < bpm.min ||
        Math.min(...ranges.map(({ min }) => min)) > bpm.max) return false
    }
    if (!chartActive) return true

    return song.charts.some((chart, index) => {
      if (!chart) return false
      if (filters.difficulties.length && !filters.difficulties.includes(DIFFICULTY_KEYS[index])) return false
      if (filters.levels.length && (chart.level === null || !filters.levels.includes(String(chart.level)))) return false
      if (filters.lamps.length && (chart.lamp === null || !filters.lamps.includes(chart.lamp))) return false
      if (bpActive && (chart.misses === null || chart.misses < bp.min || chart.misses > bp.max)) return false
      return flags.every((flag) => {
        if (chart.options === null) return false
        const present = flag === 'SOF-LAN'
          ? Boolean(song.bpmRange?.max || chart.bpmRange?.max)
          : (chart.options & MUSIC_OPTIONS[flag]) !== 0
        return present === (filters.flags[flag] === 'yes')
      })
    })
  })
}
