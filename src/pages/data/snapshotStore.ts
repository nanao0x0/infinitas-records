import type { PlayStyle } from '../../settings/playStyle'
import type { LampCounts } from '../dashboard/dashboardData'

export const snapshotLimit = 100

export type Snapshot = {
  id: string
  playStyle: PlayStyle
  savedAt: number
  name: string
  method: 'file' | 'text'
  songCount: number
  size: number
}

export type StoredSnapshot = Snapshot & { gzip: Uint8Array }
export type SnapshotTrendCounts = { counts: LampCounts; levels: LampCounts[] }
type CachedTrend = SnapshotTrendCounts & { id: string; version: string }

export function newestSnapshotFirst(a: Snapshot, b: Snapshot) {
  return b.savedAt - a.savedAt || b.id.localeCompare(a.id)
}

const records = 'snapshots'
const metadata = 'snapshotMetadata'
const trendCache = 'snapshotTrendCache'
const changes = new EventTarget()
let database: Promise<IDBDatabase> | undefined

export function subscribeToSnapshots(listener: () => void) {
  changes.addEventListener('change', listener)
  return () => changes.removeEventListener('change', listener)
}

function openDatabase() {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('infinitas-records', 3)
      request.onupgradeneeded = (event) => {
        const store = event.oldVersion === 0
          ? request.result.createObjectStore(records, { keyPath: 'id' })
          : request.transaction!.objectStore(records)
        if (event.oldVersion < 2) store.createIndex(metadata, ['savedAt', 'id', 'playStyle', 'name', 'method', 'songCount', 'size'])
        request.result.createObjectStore(trendCache, { keyPath: 'id' })
      }
      request.onsuccess = () => {
        const db = request.result
        db.onversionchange = () => {
          db.close()
          database = undefined
        }
        resolve(db)
      }
      request.onerror = () => reject(request.error)
    }).catch((error) => {
      database = undefined
      throw error
    })
  }
  return database
}

async function requestRecords<T>(run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(records).objectStore(records))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function getStoredSnapshots() {
  return requestRecords<StoredSnapshot[]>((store) => store.getAll())
}

export function getStoredSnapshot(id: string) {
  return requestRecords<StoredSnapshot | undefined>((store) => store.get(id))
}

export async function readSnapshotTrendCache(version: string) {
  const db = await openDatabase()
  return new Promise<Map<string, SnapshotTrendCounts>>((resolve, reject) => {
    const request = db.transaction(trendCache).objectStore(trendCache).getAll() as IDBRequest<CachedTrend[]>
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      resolve(new Map(request.result.filter((item) => item.version === version).map(({ id, counts, levels }) => [id, { counts, levels }])))
    }
  })
}

export async function saveSnapshotTrendCache(version: string, entries: ReadonlyMap<string, SnapshotTrendCounts>) {
  if (!entries.size) return
  const db = await openDatabase()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([records, trendCache], 'readwrite')
    const store = transaction.objectStore(records)
    const cache = transaction.objectStore(trendCache)
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error)
    for (const [id, trend] of entries) {
      const request = store.getKey(id)
      request.onsuccess = () => {
        if (request.result !== undefined) cache.put({ ...trend, version, id })
      }
    }
  })
}

function readSnapshotMetadata(store: IDBObjectStore, onComplete: (snapshots: Snapshot[]) => void) {
  const snapshots: Snapshot[] = []
  // Read the compound index without loading any compressed CSV payloads.
  const request = store.index(metadata).openKeyCursor(null, 'prev')
  request.onsuccess = () => {
    const cursor = request.result
    if (!cursor) {
      onComplete(snapshots)
      return
    }
    const [savedAt, id, playStyle, name, method, songCount, size] = cursor.key as [
      number, string, PlayStyle, string, Snapshot['method'], number, number,
    ]
    snapshots.push({ savedAt, id, playStyle, name, method, songCount, size })
    cursor.continue()
  }
  return request
}

export async function listSnapshots(): Promise<Snapshot[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = readSnapshotMetadata(db.transaction(records).objectStore(records), resolve)
    request.onerror = () => reject(request.error)
  })
}

type SaveResult =
  | { saved: true; count: number }
  | { saved: false; evictions: Snapshot[]; count: number }

export async function saveSnapshots(incoming: StoredSnapshot[], allowEviction: boolean | readonly string[]): Promise<SaveResult> {
  if (!incoming.length) return { saved: true, count: 0 }
  const additions = incoming.toSorted((a, b) => b.savedAt - a.savedAt).slice(0, snapshotLimit)
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([records, trendCache], 'readwrite')
    const store = transaction.objectStore(records)
    let result: SaveResult = { saved: true, count: 0 }
    let limitError: Error | undefined
    transaction.oncomplete = () => {
      if (result.saved && result.count) changes.dispatchEvent(new Event('change'))
      resolve(result)
    }
    transaction.onabort = () => reject(limitError ?? transaction.error)

    readSnapshotMetadata(store, (snapshots) => {
      const sameStyle = snapshots.filter((item) => item.playStyle === incoming[0].playStyle)

      if (sameStyle.length > snapshotLimit) {
        limitError = new Error(`保存済みのCSVが現在の上限（${snapshotLimit}件）を超えています。追加するには一覧から件数を減らしてください。`)
        transaction.abort()
        return
      }
      const evictions = sameStyle.slice(snapshotLimit - additions.length).reverse()
      if (evictions.length && allowEviction !== true &&
        (allowEviction === false || evictions.some(({ id }) => !allowEviction.includes(id)))) {
        result = { saved: false, evictions, count: additions.length }
        return
      }

      const latestSavedAt = sameStyle[0]?.savedAt ?? -Infinity
      const oldestIncoming = additions[additions.length - 1]
      const overlaps = oldestIncoming.savedAt <= latestSavedAt
      // Keep existing timestamps intact. Use import time when the batch would interleave with them.
      let previousSavedAt = overlaps ? Math.max(Date.now() - additions.length, latestSavedAt) : latestSavedAt
      for (const { id } of evictions) {
        store.delete(id)
        transaction.objectStore(trendCache).delete(id)
      }
      for (const snapshot of additions.toReversed()) {
        const savedAt = overlaps ? previousSavedAt + 1 : Math.max(snapshot.savedAt, previousSavedAt + 1)
        store.add({ ...snapshot, savedAt })
        previousSavedAt = savedAt
      }
      result = { saved: true, count: additions.length }
    })
  })
}

export async function deleteSnapshots(ids: string[]) {
  const db = await openDatabase()
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction([records, trendCache], 'readwrite')
    const store = transaction.objectStore(records)
    let deleted = 0
    transaction.oncomplete = () => {
      if (deleted) changes.dispatchEvent(new Event('change'))
      resolve(deleted)
    }
    transaction.onabort = () => reject(transaction.error)
    for (const id of new Set(ids)) {
      const request = store.getKey(id)
      request.onsuccess = () => {
        transaction.objectStore(trendCache).delete(id)
        if (request.result === undefined) return
        store.delete(id)
        deleted++
      }
    }
  })
}
