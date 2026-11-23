import type { VersionData } from '../../../types/versions'

const modules = import.meta.glob<VersionData>([
  '../../../data/versions/*.ts',
  '!../../../data/versions/all.ts',
  '!../../../data/versions/constants.ts',
], { eager: true, import: 'default' })

function versionOrder(id: string) {
  if (id === 'substream') return 1.5
  if (id === 'infinitas') return Infinity
  return Number(/^iidx(\d+)$/.exec(id)?.[1] ?? Number.MAX_SAFE_INTEGER)
}

export const masterVersions = Object.values(modules).sort((a, b) =>
  versionOrder(a.id) - versionOrder(b.id) || a.name.localeCompare(b.name, 'ja'),
)

export const versionChoices = masterVersions.map(({ id, shorthand }) => ({ value: id, label: shorthand }))
