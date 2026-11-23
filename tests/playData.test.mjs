import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { IDBFactory } from 'fake-indexeddb'
import { gunzipSync, gzipSync, unzipSync } from 'fflate'
import Papa from 'papaparse'
import { build, createServer } from 'vite'

const difficulties = ['BEGINNER', 'NORMAL', 'HYPER', 'ANOTHER', 'LEGGENDARIA']
const fields = ['スコア', '最終スコア更新時刻', 'ミスカウント', 'クリアタイプ', 'プレー回数', '最終プレー日時']
const savedAt = Date.UTC(2025, 0, 1)
const encoder = new TextEncoder()
let server
let csvModule
let store

function fixture({ beginner = true, lamp = 'HARD CLEAR' } = {}) {
  const charts = beginner ? difficulties : difficulties.slice(1)
  return Papa.unparse([
    ['バージョン', 'タイトル', 'アーティスト', ...charts.flatMap((chart) => fields.map((field) => `${chart} ${field}`))],
    ['1st style', 'TEST SONG', 'TEST ARTIST', ...charts.flatMap(() => ['100', '---', '---', lamp, '1', '---'])],
  ])
}

before(async () => {
  globalThis.indexedDB = new IDBFactory()
  server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom', logLevel: 'error' })
  csvModule = await server.ssrLoadModule('/src/pages/data/snapshotCsv.ts')
  store = await server.ssrLoadModule('/src/pages/data/snapshotStore.ts')
})

after(async () => {
  await server?.close()
})

test('取り込みと楽曲の読み取りで同じクリアタイプを使う', async () => {
  const { readPlayRecords } = await server.ssrLoadModule('/src/pages/search/songCatalog.ts')
  const csv = fixture({ lamp: 'FULLCOMBO CLEAR' })
  assert.equal(csvModule.validateCsv(csv, 'SP'), 1)
  const [record] = [...readPlayRecords(csv).values()].flat()
  assert.equal(record.charts.normal.lamp, 'FC')

  const invalid = fixture({ lamp: 'UNKNOWN_TEST_STATUS' })
  assert.throws(() => csvModule.validateCsv(invalid, 'SP'), /データ行 1/)
  // Previously saved data with an unknown lamp can still be displayed.
  const [legacy] = [...readPlayRecords(invalid).values()].flat()
  assert.equal(legacy.charts.normal.lamp, null)
})

test('ファイルとテキストで明らかな SP・DP の不一致を検出する', async () => {
  const text = fixture()
  await assert.rejects(() => csvModule.prepareSnapshots({ text }, 'DP'), /SP のCSV/)
  await assert.rejects(() => csvModule.prepareSnapshots({ files: [new File([text], 'renamed.csv')] }, 'DP'), /SP のCSV/)
  const dp = fixture({ beginner: false })
  assert.equal(csvModule.validateCsv(dp, 'DP'), 1)
  assert.equal(csvModule.validateCsv(dp, 'SP'), 1)
  await assert.rejects(() => csvModule.prepareSnapshots({ files: [new File([dp], 'sample_dp_score.csv')] }, 'SP'), /DP のCSV/)
})

test('v2 のプレーデータを引き継ぎ、ZIP の再取り込みでも同時刻の順序を維持する', async () => {
  const original = encoder.encode(fixture())
  const gzip = gzipSync(original)
  await new Promise((resolve, reject) => {
    const request = indexedDB.open('infinitas-records', 2)
    request.onupgradeneeded = () => {
      const records = request.result.createObjectStore('snapshots', { keyPath: 'id' })
      records.createIndex('snapshotMetadata', ['savedAt', 'id', 'playStyle', 'name', 'method', 'songCount', 'size'])
      for (const id of ['old-a', 'old-b']) {
        records.add({ id, name: `${id}.csv`, playStyle: 'SP', savedAt, songCount: 1, method: 'file', size: original.length, gzip })
      }
    }
    request.onsuccess = () => { request.result.close(); resolve() }
    request.onerror = () => reject(request.error)
  })

  const records = await store.listSnapshots()
  assert.deepEqual(records.map(({ id }) => id), ['old-b', 'old-a'])
  const stored = await store.getStoredSnapshots()
  assert.deepEqual(gunzipSync(stored[0].gzip), original)

  const { createSnapshotZip } = await server.ssrLoadModule('/src/pages/data/snapshotDownload.ts')
  const zip = unzipSync(await createSnapshotZip(stored))
  const names = Object.keys(zip)
  assert.deepEqual(names, ['old-b_2025-01-01T00-00-00-000Z.csv', 'old-a_2024-12-31T23-59-59-999Z.csv'])
  for (const bytes of Object.values(zip)) assert.deepEqual(bytes, original)

  const imported = await csvModule.prepareSnapshots({
    files: names.toReversed().map((name) => new File([zip[name]], name, { lastModified: 0 })),
  }, 'SP')
  assert.equal(await store.deleteSnapshots(records.map(({ id }) => id)), 2)
  assert.deepEqual(await store.saveSnapshots(imported, false), { saved: true, count: 2 })
  assert.deepEqual((await store.listSnapshots()).map(({ name }) => name), names)
})

test('同じソースでビルドした場合は同じアセット名になる', async () => {
  async function assetNames() {
    const result = await build({ logLevel: 'error', build: { write: false } })
    return result.output.map(({ fileName }) => fileName).sort()
  }
  assert.deepEqual(await assetNames(), await assetNames())
})

test('各ページの HTML は対応するページのチャンクだけを先読みする', async () => {
  const { output } = await build({ logLevel: 'error', build: { write: false } })
  const entries = ['DashboardPage', 'SearchPage', 'DataPage']
  const htmlFiles = ['index.html', 'search.html', 'data.html']
  for (const [index, fileName] of htmlFiles.entries()) {
    const html = output.find((asset) => asset.fileName === fileName).source
    const pagePreloads = [...html.matchAll(/rel="modulepreload"[^>]*href="\/assets\/(DashboardPage|SearchPage|DataPage)-[^"]+\.js"/g)]
    assert.deepEqual(pagePreloads.map((match) => match[1]), [entries[index]])
  }
})
