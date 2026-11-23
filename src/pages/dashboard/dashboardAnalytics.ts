import { DIFFICULTY_KEYS } from '../../../data/versions/constants'
import type { PlayStyle } from '../../settings/playStyle'
import { listSnapshots, readSnapshotTrendCache, saveSnapshotTrendCache, type SnapshotTrendCounts } from '../data/snapshotStore'
import type { CatalogSong } from '../search/songCatalog'
import { emptyLampCounts, lampRank, totalLampCount, type ComparisonPair, type DashboardData, type DashboardDifference, type DashboardTrack, type VersionProgress } from './dashboardData'

const dateFormat = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
const dateTimeFormat = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
declare const __DASHBOARD_CACHE_VERSION__: string
const fullSummaries = new Map<string, ReturnType<typeof summarize>>()
const fullSummaryLimit = 4

async function loadSnapshotCatalog(id: string, playStyle: PlayStyle, signal: AbortSignal) {
  signal.throwIfAborted()
  // The empty dashboard can show its import guide without loading the song master.
  const { readSnapshotCatalog } = await import('./readSnapshotCatalog')
  return readSnapshotCatalog(id, playStyle, signal)
}

function summarize(songs: CatalogSong[], includeDetails: boolean) {
  const lampCounts = emptyLampCounts()
  const levelClear = Array.from({ length: 12 }, (_, index) => ({ lv: index + 1, ...emptyLampCounts() }))
  const playsByLevel = Array<number>(12).fill(0)
  const versionCounts = new Map<string, VersionProgress>()
  const tracks: DashboardTrack[] = []
  let chartCount = 0
  let playedCount = 0
  let totalPlays = 0

  for (const song of songs) {
    let version = versionCounts.get(song.version)
    if (!version && includeDetails) {
      version = { name: song.version, counts: emptyLampCounts(), levels: levelClear.map(emptyLampCounts) }
      versionCounts.set(song.version, version)
    }
    for (const [index, chart] of song.charts.entries()) {
      if (!chart) continue
      chartCount++
      const played = (chart.plays ?? 0) > 0 || chart.lastPlayed !== null || (chart.lamp !== null && chart.lamp !== 'NO_PLAY')
      if (played) playedCount++
      totalPlays += chart.plays ?? 0

      const level = chart.level === null ? undefined : levelClear[chart.level - 1]
      if (chart.lamp) {
        lampCounts[chart.lamp]++
        if (level) level[chart.lamp]++
        if (version) {
          version.counts[chart.lamp]++
          if (level) version.levels[level.lv - 1][chart.lamp]++
        }
      }
      if (level) playsByLevel[level.lv - 1] += chart.plays ?? 0
      if (includeDetails && (played || chart.lamp === 'NO_PLAY')) {
        // CSV-only row positions can change between snapshots.
        const songId = song.csvIdentity
          ? JSON.stringify([song.csvIdentity.version, song.title, song.csvIdentity.artist])
          : song.id
        const diff = DIFFICULTY_KEYS[index].toUpperCase()
        tracks.push({
          id: `${songId}:${diff}`, title: song.title, song, diff, lv: chart.level, lamp: chart.lamp,
          bp: chart.misses, score: chart.score, plays: chart.plays, lastPlay: chart.lastPlayed,
          lastScoreUpdate: chart.lastScoreUpdated,
        })
      }
    }
  }

  const playTendencyTop5 = playsByLevel.map((plays, index) => ({ lv: `Lv.${index + 1}`, plays }))
    .filter(({ plays }) => plays > 0).sort((a, b) => b.plays - a.plays).slice(0, 5)
  const versions = Array.from(versionCounts.values()).filter(({ counts }) => totalLampCount(counts) > 0).reverse()

  return { chartCount, playedCount, totalPlays, lampCounts, levelClear, playTendencyTop5, versions, tracks }
}

function compareTracks(before: DashboardTrack[], after: DashboardTrack[]) {
  const previous = new Map<string, DashboardTrack | null>()
  for (const track of before) previous.set(track.id, previous.has(track.id) ? null : track)
  const frequencies = new Map<string, number>()
  for (const track of after) frequencies.set(track.id, (frequencies.get(track.id) ?? 0) + 1)
  const differences: DashboardDifference[] = []
  for (const current of after) {
    const old = previous.get(current.id)
    if (!old || frequencies.get(current.id) !== 1) continue
    const lamp = old.lamp && current.lamp && lampRank[current.lamp] > lampRank[old.lamp]
      ? { from: old.lamp, to: current.lamp } : null
    const bp = old.bp !== null && current.bp !== null && current.bp < old.bp
      ? { from: old.bp, to: current.bp } : null
    const score = current.score !== null && (old.score !== null || old.lamp === 'NO_PLAY') && current.score > (old.score ?? 0)
      ? { from: old.score ?? 0, to: current.score } : null
    if (lamp || bp || score) differences.push({ id: current.id, title: current.title, song: current.song, diff: current.diff, lv: current.lv, lamp, bp, score })
  }
  return differences
}

async function loadFullSummary(id: string, playStyle: PlayStyle, signal: AbortSignal) {
  signal.throwIfAborted()
  const key = `${playStyle}:${id}`
  const cached = fullSummaries.get(key)
  const summary = cached ?? summarize(await loadSnapshotCatalog(id, playStyle, signal), true)
  fullSummaries.delete(key)
  fullSummaries.set(key, summary)
  if (fullSummaries.size > fullSummaryLimit) {
    const oldest = fullSummaries.keys().next()
    if (!oldest.done) fullSummaries.delete(oldest.value)
  }
  return summary
}

export async function loadDashboardComparison(playStyle: PlayStyle, pair: ComparisonPair, signal: AbortSignal) {
  const before = await loadFullSummary(pair.fromId, playStyle, signal)
  const after = await loadFullSummary(pair.toId, playStyle, signal)
  return compareTracks(before.tracks, after.tracks)
}

type DashboardResult = { data: DashboardData; skipped: number }
const readyDashboards = new Map<PlayStyle, { snapshotIds: string; result: DashboardResult }>()

export async function loadDashboardData(
  playStyle: PlayStyle,
  signal: AbortSignal,
  showRecent?: (result: DashboardResult) => void,
): Promise<DashboardResult> {
  const snapshots = (await listSnapshots()).filter((snapshot) => snapshot.playStyle === playStyle)
  signal.throwIfAborted()
  const snapshotIds = snapshots.map(({ id }) => id).join(',')
  const ready = readyDashboards.get(playStyle)
  if (ready?.snapshotIds === snapshotIds) return ready.result
  const recent: { data: ReturnType<typeof summarize>; savedAt: number }[] = []
  const trend: DashboardData['trend'] = []
  const comparisonSnapshots: DashboardData['comparisonSnapshots'] = []
  const uncached = new Map<string, SnapshotTrendCounts>()
  let cached: Map<string, SnapshotTrendCounts> | undefined
  let differences: DashboardDifference[] = []
  let skipped = 0

  function result(): DashboardResult {
    const [latest] = recent
    return {
      data: {
        ...(latest?.data ?? summarize([], true)),
        snapshotLabel: latest ? dateTimeFormat.format(latest.savedAt) : '—',
        snapshotSavedAt: latest?.savedAt ?? null,
        comparisonSnapshots: comparisonSnapshots.slice(),
        trend: trend.toReversed(),
        differences,
      },
      skipped,
    }
  }

  for (const snapshot of snapshots) {
    signal.throwIfAborted()
    if (recent.length === 2 && !cached) {
      showRecent?.(result())
      cached = import.meta.env.DEV ? new Map() : await readSnapshotTrendCache(__DASHBOARD_CACHE_VERSION__).catch(() => new Map())
      signal.throwIfAborted()
    }
    try {
      let counts = cached?.get(snapshot.id)
      if (recent.length < 2) {
        const data = await loadFullSummary(snapshot.id, playStyle, signal)
        if (recent.length === 1) differences = compareTracks(data.tracks, recent[0].data.tracks)
        recent.push({ data, savedAt: snapshot.savedAt })
        counts = { counts: data.lampCounts, levels: data.levelClear }
      } else if (!counts) {
        const songs = await loadSnapshotCatalog(snapshot.id, playStyle, signal)
        const data = summarize(songs, false)
        counts = { counts: data.lampCounts, levels: data.levelClear }
        if (!import.meta.env.DEV) uncached.set(snapshot.id, counts)
      }
      trend.push({ label: dateFormat.format(snapshot.savedAt), ...counts })
      comparisonSnapshots.push({ id: snapshot.id, label: dateTimeFormat.format(snapshot.savedAt), savedAt: snapshot.savedAt })
    } catch {
      signal.throwIfAborted()
      skipped++
    }
  }

  signal.throwIfAborted()
  if (uncached.size) {
    await saveSnapshotTrendCache(__DASHBOARD_CACHE_VERSION__, uncached).catch(() => undefined)
  }
  signal.throwIfAborted()
  const complete = result()
  if (!skipped) readyDashboards.set(playStyle, { snapshotIds, result: complete })
  return complete
}
