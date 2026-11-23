import { useEffect, useState } from 'react'
import { listSnapshots, subscribeToSnapshots } from '../../pages/data/snapshotStore'

export type SnapshotSummary = {
  counts: { SP: number; DP: number }
}

export function useSnapshotSummary() {
  const [summary, setSummary] = useState<SnapshotSummary | null>(null)

  useEffect(() => {
    let active = true
    let revision = 0

    async function refresh() {
      const request = ++revision
      try {
        const snapshots = await listSnapshots()
        if (!active || request !== revision) return

        const counts = { SP: 0, DP: 0 }
        for (const { playStyle } of snapshots) counts[playStyle]++
        setSummary({ counts })
      } catch {
        if (active && request === revision) setSummary(null)
      }
    }

    const unsubscribe = subscribeToSnapshots(refresh)
    window.addEventListener('focus', refresh)
    void refresh()
    return () => {
      active = false
      unsubscribe()
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return summary
}
