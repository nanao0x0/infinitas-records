import { gunzipSync, zip, type Zippable } from 'fflate'
import type { PlayStyle } from '../../settings/playStyle'
import { getStoredSnapshot, getStoredSnapshots, newestSnapshotFirst, type StoredSnapshot } from './snapshotStore'
import { formatSnapshotTimestamp, stripExportTimestamp } from './snapshotTimestamp'

function download(bytes: Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export async function downloadSnapshot(id: string) {
  const snapshot = await getStoredSnapshot(id)
  if (!snapshot) throw new Error('対象のCSVが見つかりません。')
  download(gunzipSync(snapshot.gzip), snapshot.name, 'text/csv')
}

export async function createSnapshotZip(snapshots: readonly StoredSnapshot[]) {
  if (!snapshots.length) throw new Error('エクスポートするCSVがありません。')
  const entries: Zippable = Object.create(null)
  let previousTimestamp = Infinity
  for (const snapshot of snapshots.toSorted(newestSnapshotFirst)) {
    const stem = stripExportTimestamp(snapshot.name.replace(/\.csv$/i, '')).replace(/[\\/:*?"<>|\p{Cc}]/gu, '_')
    const baseName = stem || 'snapshot'
    // Older records can share a timestamp. Keep ZIP timestamps strictly descending.
    previousTimestamp = Math.min(snapshot.savedAt, previousTimestamp - 1)
    const timestamp = formatSnapshotTimestamp(previousTimestamp)
    const filename = `${baseName}_${timestamp}.csv`
    entries[filename] = gunzipSync(snapshot.gzip)
  }

  return new Promise<Uint8Array>((resolve, reject) => {
    zip(entries, { level: 6 }, (error, data) => error ? reject(error) : resolve(data))
  })
}

export async function downloadSnapshotZip(playStyle: PlayStyle) {
  const snapshots = (await getStoredSnapshots()).filter((snapshot) => snapshot.playStyle === playStyle)
  const bytes = await createSnapshotZip(snapshots)
  download(bytes, `infinitas-csv-${playStyle.toLowerCase()}.zip`, 'application/zip')
}
