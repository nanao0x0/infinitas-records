import { useEffect, useState } from 'react'
import { gunzipSync } from 'fflate'
import { DIFFICULTY_KEYS, type DifficultyKey } from '../../../data/versions/constants'
import { decodeCsv } from '../../pages/data/playCsv'
import { getStoredSnapshot, listSnapshots } from '../../pages/data/snapshotStore'
import { findSongPlayRecord, readPlayRecords, type CatalogSong } from '../../pages/search/songCatalog'
import type { PlayStyle } from '../../settings/playStyle'

export type ScorePoint = { savedAt: number; score: number }
type SongHistory = Partial<Record<DifficultyKey, ScorePoint[]>>
type HistoryResult = { scores: SongHistory; failed: boolean }

export function useSongHistory(song: CatalogSong, playStyle: PlayStyle) {
  const [result, setResult] = useState<HistoryResult>()

  useEffect(() => {
    let active = true
    async function loadHistory() {
      const scores: SongHistory = {}
      let failed = false
      try {
        const snapshots = (await listSnapshots()).filter((snapshot) => snapshot.playStyle === playStyle).reverse()
        for (const { id } of snapshots) {
          if (!active) return
          try {
            const snapshot = await getStoredSnapshot(id)
            if (!active) return
            if (!snapshot) continue
            const csv = decodeCsv(gunzipSync(snapshot.gzip))
            const record = findSongPlayRecord(song, readPlayRecords(csv, song))
            for (const difficulty of DIFFICULTY_KEYS) {
              const score = record?.charts[difficulty]?.score
              if (score != null) (scores[difficulty] ??= []).push({ savedAt: snapshot.savedAt, score })
            }
          } catch {
            failed = true
          }
        }
      } catch {
        failed = true
      }
      if (active) setResult({ scores, failed })
    }

    void loadHistory()
    return () => { active = false }
  }, [song, playStyle])

  return result
}
