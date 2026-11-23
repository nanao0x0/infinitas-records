import { useMemo } from "react";
import {
  DashboardIcon,
  LampBadge,
  PanelTitle,
  summaryGridClass,
  TrackTitle,
} from "./dashboardPresentation";
import {
  clearedCount,
  formatCount,
  panelClass,
  panelHeaderClass,
  rankDifferences,
  rowsClass,
  type DashboardData,
  type DashboardDifference,
  type OpenDashboardSong,
} from "./dashboardData";
import { comparisonTabs, type ComparisonTab } from "./dashboardPreferences";

export function DashboardSummary({
  data,
  differences,
  comparisonLoading,
}: {
  data: DashboardData;
  differences: DashboardDifference[];
  comparisonLoading: boolean;
}) {
  const counts = data.lampCounts;
  const total = data.chartCount;
  const cleared = clearedCount(counts);
  const hard = counts.HARD + counts.EX_HARD + counts.FC;
  const percentage = (value: number) =>
    total ? ((value / total) * 100).toFixed(1) : "0.0";
  const changed = (key: "lamp" | "bp" | "score") =>
    differences.filter((difference) => difference[key]).length;
  const cards = [
    {
      title: "クリア済み譜面数",
      icon: "check_circle",
      color: "text-cyan-500",
      value: cleared,
      unit: `/ ${formatCount(total)} 譜面`,
      description: `クリア率: ${percentage(cleared)}%`,
    },
    {
      title: "HARD以上 達成数",
      icon: "local_fire_department",
      color: "text-red-500",
      value: hard,
      unit: `譜面 (${percentage(hard)}%)`,
      description: `EX HARD ${formatCount(counts.EX_HARD)} · FC ${formatCount(counts.FC)}`,
    },
    {
      title: "累計プレー回数",
      icon: "monitoring",
      color: "text-sky-500",
      value: data.totalPlays,
      unit: "回",
      description: `プレー済み: ${formatCount(data.playedCount)} 譜面`,
    },
    {
      title: "比較区間の更新数",
      icon: "trending_up",
      color: "text-emerald-500",
      value: comparisonLoading ? null : differences.length,
      unit: "件の更新",
      description: comparisonLoading
        ? "記録を比較中…"
        : `ランプ ${changed("lamp")} · BP ${changed("bp")} · スコア ${changed("score")}`,
    },
  ];
  return (
    <section
      aria-label="プレー記録の概要"
      className={summaryGridClass}
    >
      {cards.map(({ title, icon, color, value, unit, description }) => (
        <div key={title} className={`${panelClass} p-4`}>
          <h2 className="flex items-center justify-between gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
            {title}
            <DashboardIcon name={icon} className={`text-lg! ${color}`} />
          </h2>
          <div className="mt-2 flex items-baseline gap-2">
            <strong className="text-2xl text-zinc-900 tabular-nums dark:text-zinc-50">
              {value === null ? "—" : formatCount(value)}
            </strong>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {unit}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
            {description}
          </p>
        </div>
      ))}
    </section>
  );
}

type DashboardComparisonProps = {
  label: string;
  differences: DashboardDifference[];
  loading: boolean;
  failed: boolean;
  tab: ComparisonTab;
  excludeFailed: boolean;
  onTabChange: (tab: ComparisonTab) => void;
  onExcludeFailedChange: (checked: boolean) => void;
  onOpenSong: OpenDashboardSong;
  onOpenComparison: () => void;
  onOpenShare?: () => void;
};

export function DashboardComparison({
  label,
  differences,
  loading,
  failed,
  tab,
  excludeFailed,
  onTabChange,
  onExcludeFailedChange,
  onOpenSong,
  onOpenComparison,
  onOpenShare,
}: DashboardComparisonProps) {
  const entries = useMemo(
    () => rankDifferences(differences, tab),
    [differences, tab],
  );
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className={panelHeaderClass}>
        <PanelTitle
          title="記録比較"
          icon="compare_arrows"
          color="text-emerald-500"
          description={label}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={onOpenComparison}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <DashboardIcon name="tune" className="text-base!" />
            比較対象を選択
          </button>
          <button
            type="button"
            aria-haspopup="dialog"
            disabled={!onOpenShare}
            onClick={onOpenShare}
            className="inline-flex items-center gap-1.5 rounded-sm bg-zinc-800 px-3 py-1.5 text-xs font-bold text-white transition-colors enabled:cursor-pointer enabled:hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:enabled:hover:bg-zinc-200"
          >
            <DashboardIcon name="share" className="text-base!" />
            SNS共有用画像を作成
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-700/60">
        <div
          role="group"
          aria-label="更新タイプ"
          className="flex flex-wrap items-center gap-2"
        >
          {comparisonTabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              onClick={() => onTabChange(key)}
              className={`cursor-pointer rounded-sm px-3 py-1 text-xs font-bold transition-colors ${
                tab === key
                  ? "bg-zinc-700 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
          <span className="relative inline-flex shrink-0 items-center">
            <input
              type="checkbox"
              role="switch"
              checked={excludeFailed}
              onChange={(event) => onExcludeFailedChange(event.target.checked)}
              className="peer sr-only"
            />
            <span className="h-5 w-9 rounded-full bg-zinc-300 transition-colors peer-checked:bg-sky-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 dark:bg-zinc-700 dark:peer-checked:bg-sky-500" />
            <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </span>
          未クリアは記録に含めない
        </label>
      </div>
      <div className={`${rowsClass} max-h-[340px] overflow-y-auto`}>
        {entries.map((item: DashboardDifference) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <TrackTitle {...item} onOpen={() => onOpenSong(item)} />
            <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums">
              {item.lamp && (
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-zinc-200 bg-zinc-100 px-2 py-0.5 dark:border-zinc-700 dark:bg-zinc-900">
                  <LampBadge lamp={item.lamp.from} format="full" />
                  <span className="text-zinc-400">→</span>
                  <LampBadge lamp={item.lamp.to} format="full" />
                </span>
              )}
              {item.bp && (
                <span className="rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  BP {item.bp.from} → {item.bp.to} ({item.bp.to - item.bp.from})
                </span>
              )}
              {item.score && (
                <span className="rounded-sm border border-sky-200 bg-sky-50 px-2 py-0.5 font-bold text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                  スコア {formatCount(item.score.from)} →{" "}
                  {formatCount(item.score.to)} (+
                  {item.score.to - item.score.from})
                </span>
              )}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p
            role="status"
            className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400"
          >
            {loading
              ? "記録を比較中…"
              : failed
                ? "比較対象のデータを読み込めませんでした。"
                : "該当する更新記録はありません。"}
          </p>
        )}
      </div>
    </section>
  );
}
