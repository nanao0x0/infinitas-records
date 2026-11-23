import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { PlayStyle } from "../../settings/playStyle";
import { DashboardLampCandidatesModal } from "./DashboardLampCandidatesModal";
import { DashboardPlayRankingModal } from "./DashboardPlayRankingModal";
import {
  DashboardIcon,
  LampBadge,
  PanelTitle,
  PreviewSelect,
  TrackTitle,
} from "./dashboardPresentation";
import {
  footerClass,
  formatCount,
  lampRank,
  levels,
  panelClass,
  panelHeaderClass,
  rowsClass,
  type DashboardData,
  type DashboardTrack,
  type OpenDashboardSong,
} from "./dashboardData";
import {
  candidateTargets,
  defaultCandidateBp,
  difficultyOptions,
  type DashboardPreferences,
  type UpdateDashboardPreference,
} from "./dashboardPreferences";

const rowClass = "flex min-w-0 items-center justify-between gap-3 px-4 py-2.5";
const pairClass = "grid grid-cols-1 gap-4 lg:grid-cols-2";
const candidatePreviewLimit = 6;

function CandidateRow({
  track,
  children,
  onOpenSong,
}: {
  track: DashboardTrack;
  children: ReactNode;
  onOpenSong: OpenDashboardSong;
}) {
  return (
    <div className={rowClass}>
      <div className="min-w-0">
        <TrackTitle {...track} onOpen={() => onOpenSong(track)} />
        <div className="mt-1 flex items-center gap-3 text-xs">
          {track.lamp && <LampBadge lamp={track.lamp} />}
          <span className="text-zinc-400 tabular-nums">
            スコア: {track.score === null ? "—" : formatCount(track.score)}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right tabular-nums">{children}</div>
    </div>
  );
}

function recordTime(value: string | null) {
  return value === null
    ? NaN
    : Date.parse(value.replaceAll("/", "-").replace(" ", "T"));
}

function EmptyList() {
  return (
    <p className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
      条件に一致する譜面はありません。
    </p>
  );
}

const day = 86400000;

export function DashboardSongLists({
  data,
  playStyle,
  preferences,
  updatePreference,
  onOpenSong,
}: {
  data: DashboardData;
  playStyle: PlayStyle;
  preferences: DashboardPreferences;
  updatePreference: UpdateDashboardPreference;
  onOpenSong: OpenDashboardSong;
}) {
  const {
    candidateLevel,
    targetLamp,
    maxBp,
    staleLevel,
    staleDifficulty,
    stagnationLevel,
  } = preferences;
  const [candidatesOpen, setCandidatesOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const closeCandidates = useCallback(() => setCandidatesOpen(false), []);
  const closeRanking = useCallback(() => setRankingOpen(false), []);
  const bpLimit = Number(maxBp || defaultCandidateBp);
  const candidates = useMemo(
    () =>
      data.tracks
        .filter(
          (track) =>
            track.bp !== null &&
            track.bp <= bpLimit &&
            track.lamp &&
            lampRank[track.lamp] < lampRank[targetLamp] &&
            (candidateLevel === "ALL" || track.lv === Number(candidateLevel)),
        )
        .sort((a, b) => (a.bp ?? Infinity) - (b.bp ?? Infinity)),
    [data.tracks, candidateLevel, bpLimit, targetLamp],
  );
  const stale = useMemo(
    () =>
      data.tracks
        .map((track) => ({ track, timestamp: recordTime(track.lastPlay) }))
        .filter(
          ({ track, timestamp }) =>
            Number.isFinite(timestamp) &&
            track.lamp !== "NO_PLAY" &&
            (staleLevel === "ALL" || track.lv === Number(staleLevel)) &&
            (staleDifficulty === "ALL" || track.diff === staleDifficulty),
        )
        .sort((a, b) => a.timestamp - b.timestamp),
    [data.tracks, staleLevel, staleDifficulty],
  );
  const ranking = useMemo(
    () =>
      data.tracks
        .filter(({ plays }) => (plays ?? 0) > 0)
        .sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0)),
    [data.tracks],
  );
  const stagnation = useMemo(
    () =>
      data.tracks
        .filter(
          (track) =>
            stagnationLevel === "ALL" || track.lv === Number(stagnationLevel),
        )
        .map((track) => ({
          track,
          gap: recordTime(track.lastPlay) - recordTime(track.lastScoreUpdate),
        }))
        .filter(({ gap }) => gap > 0)
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 6),
    [data.tracks, stagnationLevel],
  );
  const mostPlays = ranking[0]?.plays ?? 1;
  return (
    <div className="space-y-6">
      <div className={pairClass}>
        <section className={`${panelClass} flex flex-col overflow-hidden`}>
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PanelTitle
                title="ランプ更新候補"
                icon="target"
                color="text-red-500"
              />
              <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                {candidates.length} 件
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PreviewSelect
                label="ランプ更新候補のレベル"
                options={levels}
                value={candidateLevel}
                onChange={(value) => updatePreference("candidateLevel", value)}
              />
              <PreviewSelect
                label="目標ランプ"
                options={candidateTargets}
                value={targetLamp}
                onChange={(value) => {
                  const target = candidateTargets.find(
                    (option) => option.value === value,
                  );
                  if (target) updatePreference("targetLamp", target.value);
                }}
              />
              <label className="inline-flex h-7 cursor-text items-center gap-1 rounded-sm border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-600 transition-shadow focus-within:ring-2 focus-within:ring-zinc-400/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <span>BP</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={defaultCandidateBp}
                  value={maxBp}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (/^\d*$/.test(value)) updatePreference("maxBp", value);
                  }}
                  className="w-10 min-w-0 bg-transparent text-center font-bold text-zinc-800 tabular-nums outline-none dark:text-zinc-100"
                />
                <span>以下</span>
              </label>
            </div>
          </div>
          <div className={rowsClass}>
            {candidates.length === 0 && <EmptyList />}
            {candidates.slice(0, candidatePreviewLimit).map((track, index) => (
              <CandidateRow
                key={`${track.id}:${index}`}
                track={track}
                onOpenSong={onOpenSong}
              >
                <span className="block text-xs text-zinc-400">MIN BP</span>
                <strong className="text-sm text-red-600 dark:text-red-400">
                  {track.bp}
                </strong>
              </CandidateRow>
            ))}
          </div>
          <div className={footerClass}>
            <span>※ BP未計測（---）は除外</span>
            {candidates.length > candidatePreviewLimit && (
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setCandidatesOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-sky-600 hover:underline dark:text-sky-400"
              >
                詳細を表示
                <DashboardIcon name="open_in_new" className="text-sm!" />
              </button>
            )}
          </div>
          {candidatesOpen && (
            <DashboardLampCandidatesModal
              candidates={candidates}
              playStyle={playStyle}
              preferences={preferences}
              bpLimit={bpLimit}
              updatePreference={updatePreference}
              onOpenSong={onOpenSong}
              onClose={closeCandidates}
            />
          )}
        </section>

        <section className={`${panelClass} flex flex-col overflow-hidden`}>
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PanelTitle
                title="スコア更新狙い目（放置楽曲）"
                icon="history"
                color="text-amber-500"
              />
              <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                {stale.length} 件
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PreviewSelect
                label="スコア更新狙い目のレベル"
                options={levels}
                value={staleLevel}
                onChange={(value) => updatePreference("staleLevel", value)}
              />
              <PreviewSelect
                label="スコア更新狙い目の難易度"
                options={difficultyOptions}
                value={staleDifficulty}
                onChange={(value) => updatePreference("staleDifficulty", value)}
              />
            </div>
          </div>
          <div className={rowsClass}>
            {stale.length === 0 && <EmptyList />}
            {stale.slice(0, 6).map(({ track, timestamp }, index) => (
              <CandidateRow
                key={`${track.id}:${index}`}
                track={track}
                onOpenSong={onOpenSong}
              >
                {data.snapshotSavedAt !== null && (
                  <strong className="block text-xs text-amber-600 dark:text-amber-400">
                    {Math.max(
                      0,
                      Math.floor((data.snapshotSavedAt - timestamp) / day),
                    )}
                    日前
                  </strong>
                )}
                <span className="text-[11px] text-zinc-400">
                  {track.lastPlay?.slice(0, 10)}
                </span>
              </CandidateRow>
            ))}
          </div>
          <div className={footerClass}>
            ※ 最終プレー日時が古い順に抽出（NO PLAY除く）
          </div>
        </section>
      </div>

      <div className={pairClass}>
        <section className={`${panelClass} flex flex-col overflow-hidden`}>
          <div className={panelHeaderClass}>
            <PanelTitle
              title="プレー回数ランキング"
              icon="trophy"
              color="text-sky-500"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              累計プレー上位
            </span>
          </div>
          <div className={rowsClass}>
            {ranking.length === 0 && <EmptyList />}
            {ranking.slice(0, 6).map((track, index) => (
              <div key={`${track.id}:${index}`} className={rowClass}>
                <strong
                  className={`w-6 shrink-0 text-center text-sm tabular-nums ${index < 3 ? "text-amber-500" : "text-zinc-400"}`}
                >
                  {index + 1}
                </strong>
                <div className="min-w-0 flex-1">
                  <TrackTitle {...track} onOpen={() => onOpenSong(track)} />
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{
                        width: `${Math.round(((track.plays ?? 0) / mostPlays) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs text-zinc-400 tabular-nums">
                  <strong className="text-sm text-zinc-900 dark:text-zinc-50">
                    {track.plays}
                  </strong>{" "}
                  回
                </div>
              </div>
            ))}
          </div>
          <div className={footerClass}>
            <span>最新のプレーデータをもとに集計</span>
            <button
              type="button"
              aria-haspopup="dialog"
              disabled={ranking.length === 0}
              onClick={() => setRankingOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 enabled:cursor-pointer enabled:hover:underline disabled:opacity-50 dark:text-sky-400"
            >
              トップ100を表示
              <DashboardIcon name="open_in_new" className="text-sm!" />
            </button>
          </div>
          {rankingOpen && (
            <DashboardPlayRankingModal
              ranking={ranking}
              playStyle={playStyle}
              preferences={preferences}
              updatePreference={updatePreference}
              onOpenSong={onOpenSong}
              onClose={closeRanking}
            />
          )}
        </section>
        <section className={`${panelClass} flex flex-col overflow-hidden`}>
          <div className={panelHeaderClass}>
            <PanelTitle
              title="停滞・粘着検知（スコア未更新）"
              icon="hourglass_bottom"
              color="text-orange-500"
              description="最終プレー日時と最終スコア更新時刻に開きがある譜面"
            />
            <PreviewSelect
              label="停滞・粘着検知のレベル"
              options={levels}
              value={stagnationLevel}
              onChange={(value) => updatePreference("stagnationLevel", value)}
            />
          </div>
          <div className={rowsClass}>
            {stagnation.length === 0 && <EmptyList />}
            {stagnation.map(({ track, gap }, index) => (
              <div key={`${track.id}:${index}`} className={rowClass}>
                <div className="min-w-0">
                  <TrackTitle {...track} onOpen={() => onOpenSong(track)} />
                  <p className="mt-1 text-[11px] text-zinc-500 tabular-nums dark:text-zinc-400">
                    最終更新: {track.lastScoreUpdate} / 最終プレー:{" "}
                    {track.lastPlay}
                  </p>
                </div>
                <span className="shrink-0 rounded-sm border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
                  更新差 {gap < day ? "1日未満" : `${Math.floor(gap / day)}日`}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
