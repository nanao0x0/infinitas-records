import { gunzipSync } from 'fflate'
import type { PlayStyle } from '../../settings/playStyle'
import { decodeCsv } from '../data/playCsv'
import { getStoredSnapshot } from '../data/snapshotStore'
import { buildSongCatalog, readPlayRecords } from '../search/songCatalog'

export async function readSnapshotCatalog(id: string, playStyle: PlayStyle, signal: AbortSignal) {
  signal.throwIfAborted()
  const stored = await getStoredSnapshot(id)
  signal.throwIfAborted()
  if (!stored || stored.playStyle !== playStyle) throw new Error('比較対象のCSVが見つかりません。')
  return buildSongCatalog(playStyle, readPlayRecords(decodeCsv(gunzipSync(stored.gzip))))
}
