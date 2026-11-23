import { useEffect, useState } from "react";
import type { PlayStyle } from "../../settings/playStyle";
import {
  resolveComparisonPair,
  type ComparisonPair,
  type DashboardData,
  type DashboardDifference,
} from "./dashboardData";

const noDifferences: DashboardDifference[] = [];

export function useDashboardComparison(
  playStyle: PlayStyle,
  data?: DashboardData,
  selection?: ComparisonPair,
) {
  const [loaded, setLoaded] = useState<{
    key: string;
    differences?: DashboardDifference[];
  }>();
  const snapshots = data?.comparisonSnapshots;
  const pair = snapshots && resolveComparisonPair(snapshots, selection);
  const custom =
    pair &&
    (pair.fromId !== snapshots?.[1]?.id || pair.toId !== snapshots?.[0]?.id)
      ? pair
      : undefined;
  const fromId = custom?.fromId;
  const toId = custom?.toId;
  const key =
    fromId && toId ? JSON.stringify([playStyle, fromId, toId]) : undefined;

  useEffect(() => {
    if (!key || !fromId || !toId) return;
    const operation = new AbortController();
    async function load() {
      try {
        const { loadDashboardComparison } =
          await import("./dashboardAnalytics");
        if (operation.signal.aborted || !fromId || !toId || !key) return;
        const differences = await loadDashboardComparison(
          playStyle,
          { fromId, toId },
          operation.signal,
        );
        if (!operation.signal.aborted) setLoaded({ key, differences });
      } catch {
        if (!operation.signal.aborted && key) setLoaded({ key });
      }
    }
    void load();
    return () => operation.abort();
  }, [playStyle, fromId, toId, key]);

  const current = key && loaded?.key === key ? loaded : undefined;
  const from = snapshots?.find(({ id }) => id === pair?.fromId);
  const to = snapshots?.find(({ id }) => id === pair?.toId);
  return {
    pair,
    label:
      from && to
        ? `${from.label} → ${to.label}`
        : "比較にはプレーデータが2件必要です",
    differences: key
      ? (current?.differences ?? noDifferences)
      : (data?.differences ?? noDifferences),
    loading: Boolean(key && !current),
    failed: Boolean(current && !current.differences),
  };
}
