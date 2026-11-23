const exportSuffix = /_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/i
const filenameDate = /(?:^|[ _.-])(?<year>\d{4})[-_]?(?<month>\d{2})[-_]?(?<day>\d{2})(?:[T _-]?(?<hour>\d{2})[:.-]?(?<minute>\d{2})(?:[:.-]?(?<second>\d{2}))?(?:[.-](?<ms>\d{3}))?(?<utc>Z)?)?(?=$|[ _.(])/gi

export function formatSnapshotTimestamp(timestamp: number) {
  return new Date(timestamp).toISOString().replace(/[:.]/g, '-')
}

export function stripExportTimestamp(stem: string) {
  return stem.replace(exportSuffix, '')
}

export function snapshotFileTimestamp(file: File) {
  const stem = file.name.replace(/\.csv$/i, '')
  const exported = stem.match(exportSuffix)?.[0]
  const candidates = exported ?? stem
  for (const { groups } of Array.from(candidates.matchAll(filenameDate)).reverse()) {
    if (!groups) continue
    const year = Number(groups.year)
    const month = Number(groups.month)
    const day = Number(groups.day)
    const hour = Number(groups.hour ?? 0)
    const minute = Number(groups.minute ?? 0)
    const second = Number(groups.second ?? 0)
    const ms = Number(groups.ms ?? 0)
    if (year < 1000 || hour >= 24 || minute >= 60 || second >= 60) continue
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms))
    if (utcDate.getUTCFullYear() !== year || utcDate.getUTCMonth() !== month - 1 || utcDate.getUTCDate() !== day) continue
    return groups.utc ? utcDate.getTime() : new Date(year, month - 1, day, hour, minute, second, ms).getTime()
  }
  return file.lastModified
}
