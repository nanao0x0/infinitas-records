import { useId, useState } from "react";
import {
  DIFFICULTY_KEYS,
  MUSIC_OPTIONS,
  type DifficultyKey,
} from "../../../data/versions/constants";
import { difficulties, lamps } from "../../pages/search/searchPresentation";
import type { CatalogSong } from "../../pages/search/songCatalog";
import type { PlayStyle } from "../../settings/playStyle";
import { useSlideDialog } from "../layout/useSlideDialog";
import { ScoreHistoryChart } from "./ScoreHistoryChart";
import { useSongHistory } from "./useSongHistory";

const accents = [
  ["border-lime-600 dark:border-lime-400", "#65a30d", "#a3e635"],
  ["border-sky-600 dark:border-sky-400", "#0284c7", "#38bdf8"],
  ["border-amber-600 dark:border-amber-400", "#d97706", "#fbbf24"],
  ["border-red-600 dark:border-red-400", "#dc2626", "#f87171"],
  ["border-purple-600 dark:border-purple-400", "#9333ea", "#c084fc"],
] as const;
const lampLabels = {
  NO_PLAY: "NO PLAY",
  FAILED: "FAILED",
  ASSIST: "ASSIST EASY CLEAR",
  EASY: "EASY CLEAR",
  CLEAR: "NORMAL CLEAR",
  HARD: "HARD CLEAR",
  EX_HARD: "EX HARD CLEAR",
  FC: "FULL COMBO",
};

export type SongDetailModalProps = {
  song: CatalogSong;
  playStyle: PlayStyle;
  initialDifficulty?: DifficultyKey;
  onClose: () => void;
};

function formatStat(value: number | null) {
  return value?.toLocaleString("ja-JP") ?? "—";
}

export default function SongDetailModal({
  song,
  playStyle,
  initialDifficulty,
  onClose,
}: SongDetailModalProps) {
  const { dialogProps, requestClose } = useSlideDialog(onClose);
  const titleId = useId();
  const panelId = useId();
  const enabled = song.charts.flatMap((chart, index) => (chart ? [index] : []));
  const [selected, setSelected] = useState(() => {
    const requested = initialDifficulty
      ? DIFFICULTY_KEYS.indexOf(initialDifficulty)
      : -1;
    return enabled.includes(requested)
      ? requested
      : enabled.includes(3)
        ? 3
        : (enabled[0] ?? -1);
  });
  const history = useSongHistory(song, playStyle);
  const chart = song.charts[selected];
  const diff = difficulties[selected];
  const lamp = chart?.lamp ? lamps[chart.lamp] : undefined;
  const points = history?.scores[DIFFICULTY_KEYS[selected]];
  const optionLabels =
    chart?.options == null
      ? null
      : [
          ...Object.entries(MUSIC_OPTIONS)
            .filter(([, bit]) => (chart.options! & bit) !== 0)
            .map(([label]) => label),
          ...(song.bpmRange?.max || chart.bpmRange?.max ? ["SOF-LAN"] : []),
        ];

  return (
    <dialog
      {...dialogProps}
      aria-labelledby={titleId}
      className="song-detail-dialog slide-dialog fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-md border border-zinc-200 bg-white font-dashboard shadow-md backdrop:bg-zinc-900/45 backdrop:backdrop-blur-sm sm:w-[calc(100%-2rem)] dark:border-zinc-700 dark:bg-zinc-800 dark:backdrop:bg-black/70"
    >
      <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-4 pt-4 pb-4 sm:px-6 sm:pt-5 dark:border-zinc-700">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="text-xl leading-tight font-bold tracking-wide wrap-anywhere text-zinc-900 sm:text-2xl dark:text-zinc-50"
          >
            {song.title}
          </h2>
          <p className="mt-1 text-xs wrap-anywhere text-zinc-500 sm:text-sm dark:text-zinc-400">
            {song.artist}
          </p>
        </div>
        <button
          type="button"
          autoFocus
          aria-label="閉じる"
          onClick={requestClose}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
        >
          <span
            className="material-symbols-outlined text-xl!"
            aria-hidden="true"
          >
            close
          </span>
        </button>
      </header>

      <div className="space-y-5 p-4 sm:p-6">
        <dl className="grid grid-cols-3 gap-3 rounded-md border border-zinc-200 bg-zinc-100 px-3.5 py-3 sm:gap-4 sm:px-4 dark:border-zinc-700 dark:bg-zinc-900">
          {[
            ["ジャンル", song.genre],
            ["BPM", song.bpm],
            ["プレースタイル", playStyle],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                {label}
              </dt>
              <dd className="text-xs font-medium wrap-anywhere text-zinc-800 tabular-nums sm:text-sm dark:text-zinc-200">
                {value}
                {label === "BPM" &&
                  song.charts.map(
                    (item, index) =>
                      item?.bpm &&
                      item.bpm !== song.bpm && (
                        <span
                          key={index}
                          title={`${difficulties[index].name}限定BPM`}
                          className={`ml-1.5 font-bold ${difficulties[index].text}`}
                        >
                          {item.bpm}
                        </span>
                      ),
                  )}
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            譜面を選択
          </p>
          <div
            role="tablist"
            aria-label="譜面を選択"
            className="grid grid-cols-5 gap-1.5 sm:gap-2.5"
            onKeyDown={(event) => {
              const current = enabled.indexOf(selected);
              const next =
                event.key === "ArrowRight"
                  ? enabled[(current + 1) % enabled.length]
                  : event.key === "ArrowLeft"
                    ? enabled[(current - 1 + enabled.length) % enabled.length]
                    : event.key === "Home"
                      ? enabled[0]
                      : event.key === "End"
                        ? enabled.at(-1)
                        : undefined;
              if (next === undefined) return;
              event.preventDefault();
              setSelected(next);
              event.currentTarget
                .querySelector<HTMLButtonElement>(`[data-index="${next}"]`)
                ?.focus();
            }}
          >
            {difficulties.map((item, index) => {
              const available = song.charts[index];
              const tabLamp = available?.lamp
                ? lamps[available.lamp]
                : undefined;
              const active = index === selected;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  id={`${panelId}-${index}`}
                  data-index={index}
                  aria-controls={panelId}
                  aria-selected={active}
                  aria-label={item.name}
                  tabIndex={active ? 0 : -1}
                  disabled={!available}
                  onClick={() => setSelected(index)}
                  className={`flex min-w-0 flex-col items-center gap-1.5 rounded-md border-2 px-1.5 py-2 transition-colors sm:px-2 ${
                    active
                      ? `bg-white dark:bg-zinc-800 ${accents[index][0]}`
                      : "border-zinc-200 bg-zinc-100 enabled:cursor-pointer enabled:opacity-75 enabled:hover:opacity-100 disabled:opacity-35 disabled:grayscale dark:border-transparent dark:bg-zinc-950/60"
                  }`}
                >
                  <span className="flex w-full items-center justify-between gap-1">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs leading-none font-bold text-white ${available ? item.dot : "bg-zinc-400 dark:bg-zinc-600"}`}
                    >
                      {item.key}
                    </span>
                    <span
                      className={`text-xs leading-none font-bold tabular-nums sm:text-sm ${available ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400 dark:text-zinc-500"}`}
                    >
                      {available ? (available.level ?? "?") : "-"}
                    </span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-bold sm:text-xs dark:border-transparent dark:bg-zinc-950/80 ${tabLamp?.text ?? "text-zinc-400"}`}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${tabLamp?.dot ?? "bg-zinc-400"}`}
                    />
                    {tabLamp?.short ?? (available ? "?" : "--")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {chart ? (
          <section
            id={panelId}
            role="tabpanel"
            aria-labelledby={`${panelId}-${selected}`}
            className="space-y-4 rounded-md border border-zinc-200 bg-zinc-100 p-3.5 sm:p-4 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold text-white ${diff.dot}`}
                >
                  {diff.key}
                </span>
                <span className="text-xs font-bold text-zinc-900 sm:text-sm dark:text-zinc-100">
                  {diff.name}{" "}
                  {chart.level == null ? "Lv.不明" : `Lv.${chart.level}`}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold sm:gap-2 sm:px-3 dark:border-transparent dark:bg-zinc-950/80 ${lamp?.text ?? "text-zinc-500"}`}
              >
                <span
                  className={`size-2.5 rounded-full ${lamp?.dot ?? "bg-zinc-400"}`}
                />
                {chart.lamp ? lampLabels[chart.lamp] : "不明"}
              </span>
            </div>
            <dl className="grid grid-cols-3 gap-2 sm:gap-3">
              {(
                [
                  ["スコア", chart.score],
                  ["ミスカウント", chart.misses],
                  ["プレー回数", chart.plays],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700/70 dark:bg-zinc-800"
                >
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-base font-bold text-zinc-900 tabular-nums sm:text-lg dark:text-zinc-50">
                    {formatStat(value)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                譜面オプション
              </span>
              {optionLabels?.length ? (
                optionLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-sm border border-zinc-200 bg-white px-2 py-0.5 text-xs font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {optionLabels ? "なし" : "不明"}
                </span>
              )}
            </div>
            <div>
              {points?.length ? (
                <ScoreHistoryChart
                  points={points}
                  lightColor={accents[selected][1]}
                  darkColor={accents[selected][2]}
                />
              ) : (
                <>
                  <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                    過去スコア推移
                  </p>
                  <div
                    role="status"
                    className="flex h-32 items-center justify-center rounded-md border border-zinc-200 bg-white text-xs text-zinc-500 sm:h-36 dark:border-zinc-700/70 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {!history
                      ? "履歴を読み込み中…"
                      : history.failed
                        ? "履歴を読み込めませんでした"
                        : "プレー履歴がありません"}
                  </div>
                </>
              )}
              {Boolean(points?.length && history?.failed) && (
                <p
                  role="status"
                  className="mt-2 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  一部の履歴を読み込めませんでした。
                </p>
              )}
            </div>
          </section>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            確認できる譜面情報がありません。
          </p>
        )}
      </div>
    </dialog>
  );
}
