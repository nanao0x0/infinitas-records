import { useEffect, useMemo, useRef } from "react";
import type { Chart, ChartConfiguration } from "chart.js";
import { LampBadge, PanelTitle, PreviewSelect } from "./dashboardPresentation";
import { getLampColors } from "./dashboardLampColors";
import { DashboardTrendLoading } from "./DashboardLoading";
import {
  clearedCount,
  formatCount,
  lampLegendLabel,
  lampOrder,
  levels,
  panelClass,
  totalLampCount,
  type DashboardData,
  type Lamp,
} from "./dashboardData";
import type {
  DashboardPreferences,
  UpdateDashboardPreference,
} from "./dashboardPreferences";

type ChartSeries =
  | { kind: "trend"; data: DashboardData["trend"] }
  | { kind: "lamps"; data: DashboardData["lampCounts"] }
  | { kind: "levels"; data: DashboardData["levelClear"] }
  | { kind: "tendency"; data: DashboardData["playTendencyTop5"] };
const trendLamps = lampOrder.slice(0, -1);
const levelLamps = [...lampOrder].reverse();
const allVisible: Lamp[] = [];

function chartConfig(
  { kind, data }: ChartSeries,
  dark: boolean,
  level: string,
  hidden: Lamp[],
  onToggle?: (lamp: Lamp) => void,
): ChartConfiguration {
  const lampColors = getLampColors(dark);
  const text = dark ? "#a1a1aa" : "#52525b";
  const grid = {
    color: dark ? "rgba(63, 63, 70, .5)" : "rgba(228, 228, 231, .9)",
  };
  const ticks = { color: text, font: { size: 11 } };
  const legend = {
    position: "bottom" as const,
    labels: { ...ticks, boxWidth: 12 },
    onClick: (_event: unknown, item: { datasetIndex?: number }) => {
      const lamp = (kind === "trend" ? trendLamps : levelLamps)[
        item.datasetIndex ?? -1
      ];
      if (lamp) onToggle?.(lamp);
    },
  };
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
  };

  if (kind === "trend") {
    const levelIndex = Number(level) - 1;
    return {
      type: "line",
      data: {
        labels: data.map(({ label }) => label),
        datasets: trendLamps.map((lamp) => ({
          label: lampLegendLabel(lamp),
          data: data.map(
            (point) =>
              (level === "ALL" ? point.counts : point.levels[levelIndex])[lamp],
          ),
          borderColor: lampColors[lamp],
          backgroundColor: lampColors[lamp],
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.25,
          hidden: hidden.includes(lamp),
        })),
      },
      options: {
        ...base,
        interaction: { mode: "index", intersect: false },
        plugins: { legend },
        scales: { x: { ticks, grid }, y: { ticks, grid } },
      },
    };
  }
  if (kind === "lamps") {
    const totals = data;
    const config: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        labels: lampOrder.map(lampLegendLabel),
        datasets: [
          {
            data: lampOrder.map((lamp) => totals[lamp]),
            backgroundColor: lampOrder.map((lamp) => lampColors[lamp]),
            borderWidth: 0,
          },
        ],
      },
      options: {
        ...base,
        cutout: "66%",
        plugins: { legend: { display: false } },
      },
    };
    return config;
  }
  if (kind === "levels") {
    const order = levelLamps;
    return {
      type: "bar",
      data: {
        labels: data.map(({ lv }) => `Lv.${lv}`),
        datasets: order.map((lamp) => ({
          label: lampLegendLabel(lamp),
          backgroundColor: lampColors[lamp],
          hidden: hidden.includes(lamp),
          data: data.map((row) => {
            const total = totalLampCount(row);
            return total ? Number(((row[lamp] / total) * 100).toFixed(1)) : 0;
          }),
        })),
      },
      options: {
        ...base,
        plugins: {
          legend: { ...legend, reverse: true },
          tooltip: {
            callbacks: {
              label: (item) =>
                `${item.dataset.label}: ${item.parsed.y}% (${data[item.dataIndex][order[item.datasetIndex]]}譜面)`,
            },
          },
        },
        scales: {
          x: { stacked: true, ticks, grid: { display: false } },
          y: {
            stacked: true,
            max: 100,
            grid,
            ticks: { ...ticks, callback: (value) => `${value}%` },
          },
        },
      },
    };
  }
  return {
    type: "bar",
    data: {
      labels: data.map(({ lv }) => lv),
      datasets: [
        {
          label: "プレー回数",
          data: data.map(({ plays }) => plays),
          backgroundColor: [
            "#f59e0b",
            "#0ea5e9",
            "#06b6d4",
            "#6366f1",
            "#71717a",
          ],
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...base,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { x: { ticks, grid }, y: { ticks, grid: { display: false } } },
    },
  };
}

function PreviewChart({ series, label, level = "ALL", dark, hidden = allVisible, onToggle }: {
  series: ChartSeries;
  label: string;
  level?: string;
  dark: boolean;
  hidden?: Lamp[];
  onToggle?: (lamp: Lamp) => void;
}) {
  const { kind, data } = series;
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);
  const toggle = useRef(onToggle);
  useEffect(() => {
    toggle.current = onToggle;
  }, [onToggle]);
  const hasData = kind === "lamps" || data.length > 0;
  const latestConfig = useRef<ChartConfiguration | null>(null);
  useEffect(() => {
    const config = chartConfig(series, dark, level, hidden, (lamp) => toggle.current?.(lamp));
    latestConfig.current = config;
    if (!chart.current) return;
    chart.current.data = config.data;
    chart.current.options = config.options ?? {};
    chart.current.update("none");
  }, [series, dark, level, hidden]);
  useEffect(() => {
    if (!hasData) return;
    let active = true;
    void import("./dashboardChartRuntime").then(({ Chart: ChartClass }) => {
      if (active && canvas.current && latestConfig.current)
        chart.current = new ChartClass(canvas.current, latestConfig.current);
    });
    return () => {
      active = false;
      chart.current?.destroy();
      chart.current = null;
    };
  }, [kind, hasData]);
  if (!hasData)
    return (
      <p className="grid h-full place-items-center text-xs text-zinc-500 dark:text-zinc-400">
        表示できるデータがありません。
      </p>
    );
  return <canvas ref={canvas} role="img" aria-label={label} />;
}

export function DashboardCharts({
  data,
  isDark,
  historyLoading,
  preferences,
  updatePreference,
}: {
  data: DashboardData;
  isDark: boolean;
  historyLoading: boolean;
  preferences: DashboardPreferences;
  updatePreference: UpdateDashboardPreference;
}) {
  const { trendLevel, hiddenTrendLamps, hiddenLevelLamps } = preferences;
  const { trend, lampCounts: totals, levelClear, playTendencyTop5 } = data;
  const trendSeries = useMemo<ChartSeries>(() => ({ kind: "trend", data: trend }), [trend]);
  const lampsSeries = useMemo<ChartSeries>(() => ({ kind: "lamps", data: totals }), [totals]);
  const levelSeries = useMemo<ChartSeries>(() => ({ kind: "levels", data: levelClear }), [levelClear]);
  const tendencySeries = useMemo<ChartSeries>(() => ({ kind: "tendency", data: playTendencyTop5 }), [playTendencyTop5]);
  const rate = data.chartCount
    ? Math.round((clearedCount(totals) / data.chartCount) * 100)
    : 0;
  const top = data.playTendencyTop5[0];
  const topShare = top
    ? Math.round(
        (top.plays /
          data.playTendencyTop5.reduce((sum, row) => sum + row.plays, 0)) *
          100,
      )
    : 0;
  function toggleLamp(
    key: "hiddenTrendLamps" | "hiddenLevelLamps",
    lamp: Lamp,
  ) {
    const hidden = preferences[key];
    updatePreference(
      key,
      hidden.includes(lamp)
        ? hidden.filter((item) => item !== lamp)
        : [...hidden, lamp],
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className={`${panelClass} p-4 lg:col-span-8`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <PanelTitle
              title="クリア状況の推移"
              icon="show_chart"
              color="text-sky-500"
              description="保存済みプレーデータごとのランプ別達成数"
            />
            <PreviewSelect
              label="クリア状況のレベル"
              options={levels}
              value={trendLevel}
              onChange={(value) => updatePreference("trendLevel", value)}
            />
          </div>
          <div className="relative h-72">
            {historyLoading ? (
              <DashboardTrendLoading />
            ) : <PreviewChart
              series={trendSeries}
              label="クリア状況の推移"
              level={trendLevel}
              dark={isDark}
              hidden={hiddenTrendLamps}
              onToggle={(lamp) => toggleLamp("hiddenTrendLamps", lamp)}
            />}
          </div>
        </section>
        <section className={`${panelClass} flex flex-col p-4 lg:col-span-4`}>
          <div className="mb-3">
            <PanelTitle
              title="ランプ内訳"
              icon="donut_large"
              color="text-purple-500"
              description="全譜面のクリアランプ構成比"
            />
          </div>
          <div className="relative h-52 shrink-0">
            <PreviewChart
              series={lampsSeries}
              label="ランプ内訳"
              dark={isDark}
            />
            {data.trend.length > 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  クリア率
                </span>
                <strong className="text-xl text-zinc-800 tabular-nums dark:text-zinc-100">
                  {rate}%
                </strong>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {lampOrder.map((lamp) => (
              <div
                key={lamp}
                className="flex min-w-0 items-center justify-between gap-1.5"
              >
                <LampBadge lamp={lamp} format="legend" />
                <strong className="text-zinc-800 tabular-nums dark:text-zinc-100">
                  {totals[lamp]}
                </strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className={`${panelClass} p-4 lg:col-span-8`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <PanelTitle
              title="レベル別クリア率（ランプ種類別）"
              icon="bar_chart"
              color="text-cyan-500"
              description="Lv.1〜Lv.12 各レベルのランプ構成割合（ホバーで割合・実数値を表示）"
            />
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              ※ 凡例クリックでランプ表示切替
            </span>
          </div>
          <div className="relative h-72">
            <PreviewChart
              series={levelSeries}
              label="レベル別クリア率"
              dark={isDark}
              hidden={hiddenLevelLamps}
              onToggle={(lamp) => toggleLamp("hiddenLevelLamps", lamp)}
            />
          </div>
        </section>
        <section className={`${panelClass} p-4 lg:col-span-4`}>
          <div className="mb-3">
            <PanelTitle
              title="プレー傾向（レベル別 Top 5）"
              icon="leaderboard"
              color="text-amber-500"
              description="プレー回数が多いレベル帯トップ5"
            />
          </div>
          <div className="relative h-56">
            <PreviewChart
              series={tendencySeries}
              label="レベル別プレー傾向"
              dark={isDark}
            />
          </div>
          {top && (
            <p className="mt-3 border-t border-zinc-100 pt-2.5 text-xs text-zinc-600 dark:border-zinc-700/70 dark:text-zinc-300">
              最多プレー帯は{" "}
              <strong className="text-zinc-900 dark:text-zinc-50">
                {top.lv}
              </strong>
              （{formatCount(top.plays)}回 / 上位5帯の{topShare}%）です。
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
