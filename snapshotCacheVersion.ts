import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function snapshotCacheVersion(root: string) {
  const masterDirectory = 'data/versions'
  const masterFiles = readdirSync(join(root, masterDirectory))
    .filter((name) => name.endsWith('.ts') && name !== 'all.ts')
    .map((name) => `${masterDirectory}/${name}`)
  const inputs = [
    ...masterFiles,
    'data/csvSongCorrections.ts',
    'src/pages/data/playCsv.ts',
    'src/pages/dashboard/dashboardAnalytics.ts',
    'src/pages/dashboard/dashboardData.ts',
    'src/pages/dashboard/readSnapshotCatalog.ts',
    'src/pages/search/masterVersions.ts',
    'src/pages/search/songCatalog.ts',
  ].sort()
  const hash = createHash('sha256')
  for (const file of inputs) {
    hash.update(file)
    hash.update('\0')
    hash.update(readFileSync(join(root, file), 'utf8').replaceAll('\r\n', '\n'))
    hash.update('\0')
  }
  return hash.digest('hex')
}
