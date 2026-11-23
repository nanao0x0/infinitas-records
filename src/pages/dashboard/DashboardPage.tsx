import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DIFFICULTY_KEYS } from "../../../data/versions/constants";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { usePlayStyle, type PlayStyle } from "../../settings/playStyle";
import { subscribeToSnapshots } from "../data/snapshotStore";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardComparisonModal } from "./DashboardComparisonModal";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { DashboardLoading } from "./DashboardLoading";
import { DashboardComparison, DashboardSummary } from "./DashboardOverview";
import { DashboardShareModal } from "./DashboardShareModal";
import { DashboardSongLists } from "./DashboardSongLists";
import { DashboardVersionProgress } from "./DashboardVersionProgress";
import {
  resolveComparisonPair,
  type ComparisonPair,
  type DashboardData,
  type DashboardSongReference,
} from "./dashboardData";
import { useDashboardPreferences } from "./dashboardPreferences";
import { useDashboardComparison } from "./useDashboardComparison";

const SongDetailModal = lazy(
  () => import("../../components/song-detail/SongDetailModal"),
);

export function DashboardPage({ isDark }: { isDark: boolean }) {
  const { playStyle } = usePlayStyle();
  const { preferences, updatePreference } = useDashboardPreferences();
  const [result, setResult] = useState<{
    style: typeof playStyle;
    data?: DashboardData;
    skipped?: number;
    historyLoading?: boolean;
  }>();
  const [songSelection, setSongSelection] = useState<
    DashboardSongReference & { playStyle: typeof playStyle }
  >();
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [comparisonPairs, setComparisonPairs] = useState<
    Partial<Record<PlayStyle, ComparisonPair>>
  >({});
  const closeSong = useCallback(() => setSongSelection(undefined), []);
  const closeComparison = useCallback(() => setComparisonOpen(false), []);
  const closeShare = useCallback(() => setShareOpen(false), []);

  function openSong(track: DashboardSongReference) {
    setSongSelection({ ...track, playStyle });
  }

  useEffect(() => {
    let pending: AbortController | undefined;
    async function refresh() {
      pending?.abort();
      const operation = new AbortController();
      pending = operation;
      try {
        const { loadDashboardData } = await import("./dashboardAnalytics");
        if (operation.signal.aborted) return;
        const values = await loadDashboardData(playStyle, operation.signal, (recent) => {
          if (operation.signal.aborted) return;
          setResult((current) => {
            const samePair =
              current?.data?.comparisonSnapshots[0]?.id === recent.data.comparisonSnapshots[0]?.id &&
              current?.data?.comparisonSnapshots[1]?.id === recent.data.comparisonSnapshots[1]?.id;
            if (current?.style === playStyle && !current.historyLoading && samePair) return current;
            return { style: playStyle, ...recent, historyLoading: true };
          });
        });
        if (!operation.signal.aborted) {
          setResult((current) =>
            current?.style === playStyle && current.data === values.data
              ? current
              : { style: playStyle, ...values },
          );
        }
      } catch {
        if (!operation.signal.aborted) setResult({ style: playStyle });
      }
    }

    const unsubscribe = subscribeToSnapshots(refresh);
    window.addEventListener("focus", refresh);
    void refresh();
    return () => {
      pending?.abort();
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, [playStyle]);

  const selected = result?.style === playStyle ? result : undefined;
  const noSnapshots = selected?.data?.trend.length === 0 && !selected?.skipped;
  const data = selected?.data?.trend.length ? selected.data : undefined;
  const comparison = useDashboardComparison(
    playStyle,
    data,
    comparisonPairs[playStyle],
  );
  const comparisonEnd = data?.comparisonSnapshots.find(
    ({ id }) => id === comparison.pair?.toId,
  );
  const canShare = Boolean(
    comparisonEnd && !comparison.loading && !comparison.failed,
  );
  const differences = useMemo(
    () =>
      comparison.differences.filter(
        (difference) =>
          !preferences.excludeFailed ||
          difference.lamp?.from !== "NO_PLAY" ||
          difference.lamp.to !== "FAILED",
      ),
    [comparison.differences, preferences.excludeFailed],
  );

  return (
    <div className="space-y-6 font-dashboard">
      <DashboardHeader snapshotLabel={data?.snapshotLabel} />
      {!selected && <DashboardLoading />}
      {selected && !data && !noSnapshots && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          プレーデータを読み込めませんでした。
        </p>
      )}
      {noSnapshots && <DashboardEmptyState playStyle={playStyle} />}
      {data && (
        <>
          {Boolean(selected?.skipped) && (
            <p
              role="status"
              className="text-sm text-zinc-500 dark:text-zinc-400"
            >
              {selected?.skipped}{" "}
              件のプレーデータを読み込めなかったため、読み取れたデータを表示しています。
            </p>
          )}
          <DashboardSummary
            data={data}
            differences={differences}
            comparisonLoading={comparison.loading}
          />
          <DashboardComparison
            label={comparison.label}
            differences={differences}
            loading={comparison.loading}
            failed={comparison.failed}
            tab={preferences.comparisonTab}
            excludeFailed={preferences.excludeFailed}
            onTabChange={(tab) => updatePreference("comparisonTab", tab)}
            onExcludeFailedChange={(checked) =>
              updatePreference("excludeFailed", checked)
            }
            onOpenSong={openSong}
            onOpenComparison={() => setComparisonOpen(true)}
            onOpenShare={canShare ? () => setShareOpen(true) : undefined}
          />
          <DashboardCharts
            data={data}
            isDark={isDark}
            historyLoading={selected?.historyLoading ?? false}
            preferences={preferences}
            updatePreference={updatePreference}
          />
          <DashboardVersionProgress
            versions={data.versions}
            playStyle={playStyle}
            isDark={isDark}
            level={preferences.versionLevel}
            onLevelChange={(level) => updatePreference("versionLevel", level)}
          />
          <DashboardSongLists
            data={data}
            playStyle={playStyle}
            preferences={preferences}
            updatePreference={updatePreference}
            onOpenSong={openSong}
          />
          {comparisonOpen && (
            <DashboardComparisonModal
              snapshots={data.comparisonSnapshots}
              historyLoading={selected?.historyLoading ?? false}
              pair={comparison.pair}
              onChange={(pair) => {
                const defaultPair = resolveComparisonPair(
                  data.comparisonSnapshots,
                );
                const followsLatest =
                  pair.fromId === defaultPair?.fromId &&
                  pair.toId === defaultPair.toId;
                setComparisonPairs((current) => ({
                  ...current,
                  [playStyle]: followsLatest ? undefined : pair,
                }));
              }}
              onClose={closeComparison}
            />
          )}
          {shareOpen && comparisonEnd && (
            <DashboardShareModal
              playStyle={playStyle}
              comparisonLabel={comparison.label}
              comparisonEnd={comparisonEnd.savedAt}
              differences={differences}
              isDark={isDark}
              focus={preferences.shareFocus}
              onFocusChange={(focus) => updatePreference("shareFocus", focus)}
              onClose={closeShare}
            />
          )}
        </>
      )}
      {data && songSelection && (
        <Suspense fallback={null}>
          <SongDetailModal
            song={songSelection.song}
            playStyle={songSelection.playStyle}
            initialDifficulty={DIFFICULTY_KEYS.find(
              (key) => key.toUpperCase() === songSelection.diff,
            )}
            onClose={closeSong}
          />
        </Suspense>
      )}
    </div>
  );
}
