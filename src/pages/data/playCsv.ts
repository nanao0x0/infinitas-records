import Papa from 'papaparse'
import { DIFFICULTY_KEYS } from '../../../data/versions/constants'
import type { lamps } from '../search/searchPresentation'

const csvLamps = new Map<string, keyof typeof lamps>([
  ['NO PLAY', 'NO_PLAY'],
  ['FAILED', 'FAILED'],
  ['ASSIST CLEAR', 'ASSIST'],
  ['ASSIST EASY CLEAR', 'ASSIST'],
  ['EASY CLEAR', 'EASY'],
  ['CLEAR', 'CLEAR'],
  ['NORMAL CLEAR', 'CLEAR'],
  ['HARD CLEAR', 'HARD'],
  ['EX HARD CLEAR', 'EX_HARD'],
  ['FULLCOMBO CLEAR', 'FC'],
  ['FULL COMBO CLEAR', 'FC'],
  ['FULL COMBO', 'FC'],
])

export function parseCsvLamp(value?: string) {
  return csvLamps.get(value?.trim().toUpperCase() ?? '') ?? null
}

export function parseCsvCount(value?: string) {
  const digits = value?.trim()
  if (!digits || !/^\d+$/.test(digits)) return null
  const count = Number(digits)
  return Number.isSafeInteger(count) ? count : null
}

export function decodeCsv(bytes: Uint8Array) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('shift_jis').decode(bytes)
  }
}

export function readCsvTable(text: string) {
  const { data, errors } = Papa.parse<string[]>(text, { delimiter: ',', skipEmptyLines: 'greedy' })
  const [rawHeader, ...rows] = data
  const header = rawHeader?.map((value) => value.trim()) ?? []
  while (header.at(-1) === '') header.pop()
  const columns = new Map<string, number>()
  header.forEach((name, index) => {
    if (!columns.has(name)) columns.set(name, index)
  })
  const indexOf = (name: string) => columns.get(name) ?? -1
  const chartColumns = DIFFICULTY_KEYS.map((difficulty) => {
    const prefix = difficulty.toUpperCase()
    const fields = {
      lamp: indexOf(`${prefix} クリアタイプ`),
      score: indexOf(`${prefix} スコア`),
      misses: indexOf(`${prefix} ミスカウント`),
      plays: indexOf(`${prefix} プレー回数`),
      lastPlayed: indexOf(`${prefix} 最終プレー日時`),
      lastScoreUpdated: indexOf(`${prefix} 最終スコア更新時刻`),
    }
    const indices = Object.values(fields)
    return { difficulty, ...fields, present: indices.some((index) => index >= 0), complete: indices.every((index) => index >= 0) }
  })
  return {
    rows, errors, chartColumns,
    headerLength: header.length,
    duplicateColumns: columns.size !== header.length,
    titleColumn: indexOf('タイトル'),
    artistColumn: indexOf('アーティスト'),
    versionColumn: indexOf('バージョン'),
  }
}
