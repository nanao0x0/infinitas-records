import { useEffect, useMemo, useState } from 'react'
import { gunzipSync } from 'fflate'
import type { PlayStyle } from '../../settings/playStyle'
import { decodeCsv } from '../data/playCsv'
import { getStoredSnapshot, listSnapshots, subscribeToSnapshots } from '../data/snapshotStore'
import { buildSongCatalog, readPlayRecords, type CatalogSong, type PlayRecords } from './songCatalog'

const emptyRecords: PlayRecords = new Map()
const emptyCatalog: CatalogSong[] = []

export function useSongCatalog(playStyle: PlayStyle) {
  const [result, setResult] = useState<{ style: PlayStyle; records: PlayRecords; failed: boolean }>()

  useEffect(() => {
    let active = true
    let revision = 0

    async function loadLatestRecords() {
      const request = ++revision
      try {
        const latest = (await listSnapshots()).find((snapshot) => snapshot.playStyle === playStyle)
        const snapshot = latest ? await getStoredSnapshot(latest.id) : undefined
        if (!active || request !== revision) return
        const records = snapshot ? readPlayRecords(decodeCsv(gunzipSync(snapshot.gzip))) : emptyRecords
        setResult({ style: playStyle, records, failed: false })
      } catch {
        if (active && request === revision) {
          setResult({ style: playStyle, records: emptyRecords, failed: true })
        }
      }
    }

    const unsubscribe = subscribeToSnapshots(loadLatestRecords)
    window.addEventListener('focus', loadLatestRecords)
    void loadLatestRecords()
    return () => {
      active = false
      unsubscribe()
      window.removeEventListener('focus', loadLatestRecords)
    }
  }, [playStyle])

  const current = result?.style === playStyle ? result : undefined
  const records = current?.records
  const songs = useMemo(() => records ? buildSongCatalog(playStyle, records) : emptyCatalog, [playStyle, records])
  return { songs, failed: current?.failed ?? false, loading: current === undefined }
}
