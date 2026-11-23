import { useEffect, useId, useMemo, useRef } from "react";
import { useSlideDialog } from "../../components/layout/useSlideDialog";
import type { PlayStyle } from "../../settings/playStyle";
import {
  formatCount,
  levels,
  type DashboardTrack,
  type OpenDashboardSong,
} from "./dashboardData";
import type {
  DashboardPreferences,
  UpdateDashboardPreference,
} from "./dashboardPreferences";
import {
  DashboardIcon,
  DifficultyBadge,
  LampBadge,
  PreviewSelect,
} from "./dashboardPresentation";

const rankingLimit = 100;

export function DashboardPlayRankingModal({
  ranking,
  playStyle,
  preferences,
  updatePreference,
  onOpenSong,
  onClose,
}: {
  ranking: DashboardTrack[];
  playStyle: PlayStyle;
  preferences: DashboardPreferences;
  updatePreference: UpdateDashboardPreference;
  onOpenSong: OpenDashboardSong;
  onClose: () => void;
}) {
  const { dialogProps, requestClose } = useSlideDialog(onClose);
  const titleId = useId();
  const subtitleId = useId();
  const results = useRef<HTMLDivElement>(null);
  const { rankingQuery, rankingLevel } = preferences;
  const ranked = useMemo(() => {
    const query = rankingQuery.normalize("NFKC").trim().toLowerCase();
    const level = rankingLevel === "ALL" ? null : Number(rankingLevel);
    return ranking
      .filter(
        (track) =>
          (level === null || track.lv === level) &&
          (!query ||
            track.title.normalize("NFKC").toLowerCase().includes(query)),
      )
      .slice(0, rankingLimit);
  }, [ranking, rankingQuery, rankingLevel]);

  useEffect(() => {
    if (results.current) results.current.scrollTop = 0;
  }, [rankingQuery, rankingLevel]);

  return (
    <dialog
      {...dialogProps}
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      className="slide-dialog fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-md border border-zinc-200 bg-white font-dashboard shadow-2xl backdrop:bg-zinc-900/45 backdrop:backdrop-blur-sm md:max-w-[720px] dark:border-zinc-700 dark:bg-zinc-800 dark:backdrop:bg-black/70"
    >
      <div className="flex max-h-[calc(85dvh-2px)] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <div>
            <h2
              id={titleId}
              className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50"
            >
              <DashboardIcon name="trophy" className="text-xl! text-sky-500" />
              プレー回数ランキング トップ100
            </h2>
            <p
              id={subtitleId}
              className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400"
            >
              {playStyle} /{" "}
              {rankingLevel === "ALL" ? "全レベル" : `Lv.${rankingLevel}`} /
              上位 {ranked.length} 譜面
            </p>
          </div>
          <button
            type="button"
            autoFocus
            aria-label="閉じる"
            onClick={requestClose}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <DashboardIcon name="close" className="text-xl!" />
          </button>
        </header>
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-900/40">
          <input
            type="search"
            aria-label="曲名で絞り込み"
            placeholder="曲名で絞り込み..."
            value={rankingQuery}
            onChange={(event) =>
              updatePreference("rankingQuery", event.target.value)
            }
            className="min-w-[180px] flex-1 rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-800 focus:ring-2 focus:ring-zinc-400/50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <PreviewSelect
            label="ランキングのレベル"
            options={levels}
            value={rankingLevel}
            onChange={(value) => updatePreference("rankingLevel", value)}
          />
        </div>
        <div
          ref={results}
          className="min-h-0 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-700"
        >
          {ranked.length === 0 && (
            <p
              role="status"
              className="px-5 py-10 text-center text-xs text-zinc-500 dark:text-zinc-400"
            >
              一致する譜面がありません。
            </p>
          )}
          {ranked.map((track, index) => (
            <button
              key={`${track.id}:${index}`}
              type="button"
              aria-haspopup="dialog"
              onClick={() => onOpenSong(track)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-2.5 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 dark:hover:bg-zinc-700/30"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`w-7 shrink-0 text-right text-xs font-bold tabular-nums ${index < 3 ? "text-amber-500" : "text-zinc-400"}`}
                >
                  #{index + 1}
                </span>
                <DifficultyBadge diff={track.diff} lv={track.lv} />
                <span
                  title={track.title}
                  className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50"
                >
                  {track.title}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-4 text-xs tabular-nums">
                {track.lamp && (
                  <span className="hidden sm:inline-flex">
                    <LampBadge lamp={track.lamp} />
                  </span>
                )}
                <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">
                  スコア {track.score === null ? "—" : formatCount(track.score)}
                </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-50">
                  {formatCount(track.plays ?? 0)} 回
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  );
}
