import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import {
  DIFFICULTY_KEYS,
  type DifficultyKey,
} from "../../../data/versions/constants";
import { SearchResultsLoading } from "./SearchResultsLoading";
import { difficulties, lamps } from "./searchPresentation";
import type { CatalogSong } from "./songCatalog";

const views = [
  { value: "list", label: "リスト", icon: "view_list" },
  { value: "card", label: "カード", icon: "grid_view" },
] as const;
const listColumns =
  "grid grid-cols-[minmax(0,1fr)_360px] items-center gap-4 px-4 md:grid-cols-[minmax(0,1fr)_400px]";
const panelClass =
  "rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800";
const selectedClass =
  "bg-zinc-500 text-white dark:bg-zinc-100 dark:text-zinc-800";
const idleClass =
  "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700";
// Reserve roughly one card's height until the browser has measured it.
const cardRendering =
  "[content-visibility:auto] [contain-intrinsic-block-size:auto_206px] sm:[contain-intrinsic-block-size:auto_223px]";

type OpenSong = (song: CatalogSong, difficulty?: DifficultyKey) => void;

function ChartCells({
  song,
  card,
  onOpenSong,
}: {
  song: CatalogSong;
  card: boolean;
  onOpenSong: OpenSong;
}) {
  return (
    <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
      {difficulties.map((difficulty, index) => {
        const chart = song.charts[index];
        const lamp = chart?.lamp ? lamps[chart.lamp] : null;
        return (
          <button
            key={difficulty.key}
            type="button"
            disabled={!chart}
            aria-haspopup={chart ? "dialog" : undefined}
            aria-label={`${song.title} ${difficulty.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenSong(song, DIFFICULTY_KEYS[index]);
            }}
            className={`flex min-w-0 flex-col items-center rounded-md ${card ? "gap-1.5 p-1.5 sm:gap-2 sm:p-2" : "gap-1 px-1 py-1.5 sm:px-1.5"} ${
              chart
                ? "cursor-pointer border border-transparent bg-zinc-100 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                : "pointer-events-none bg-zinc-100/60 opacity-35 grayscale dark:bg-zinc-900/40"
            }`}
          >
            <span
              className={`flex items-center gap-1 ${card ? "w-full justify-between" : "justify-center"}`}
            >
              <span
                className={`rounded py-0.5 leading-none font-bold text-white ${card ? "px-1.5 text-xs" : "px-1 text-[11px]"} ${chart ? difficulty.dot : "bg-zinc-400 dark:bg-zinc-600"}`}
              >
                {difficulty.key}
              </span>
              <span
                title={chart && chart.level == null ? "レベル不明" : undefined}
                className={`leading-none font-bold tabular-nums ${card ? "text-sm sm:text-base" : "text-xs sm:text-sm"} ${chart ? "text-zinc-800 dark:text-zinc-50" : "text-zinc-400 dark:text-zinc-500"}`}
              >
                {chart ? (chart.level ?? "?") : "-"}
              </span>
            </span>
            <span
              title={chart && !lamp ? "クリアタイプ不明" : undefined}
              className={`inline-flex items-center gap-1 rounded-full border border-zinc-200 px-1.5 py-0.5 text-[11px] font-bold sm:px-2 sm:text-xs dark:border-transparent ${card ? "" : "w-full justify-center"} ${
                lamp
                  ? `bg-white dark:bg-zinc-950/70 ${lamp.text}`
                  : "bg-white/60 text-zinc-400 dark:bg-zinc-950/40 dark:text-zinc-500"
              }`}
            >
              <span
                className={`size-1.5 shrink-0 rounded-full sm:size-2 ${lamp?.dot ?? "bg-zinc-300 dark:bg-zinc-600"}`}
              />
              {lamp?.short ?? (chart ? "?" : "--")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SongTitle({
  song,
  card,
  onOpenSong,
}: {
  song: CatalogSong;
  card: boolean;
  onOpenSong: OpenSong;
}) {
  return (
    <>
      <h3
        title={song.title}
        className={`truncate font-bold dark:text-zinc-50 ${card ? "text-base text-zinc-800 sm:text-lg" : "text-sm text-zinc-900 sm:text-base"}`}
      >
        <button
          type="button"
          aria-haspopup="dialog"
          className="block max-w-full cursor-pointer truncate text-left"
          onClick={(event) => {
            event.stopPropagation();
            onOpenSong(song);
          }}
        >
          {song.title}
        </button>
      </h3>
      <p
        title={song.artist}
        className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400"
      >
        {song.artist}
      </p>
    </>
  );
}

function SongDetails({ song, card }: { song: CatalogSong; card: boolean }) {
  const bpm = (
    <>
      {song.bpm}
      {song.charts.map(
        (chart, index) =>
          chart?.bpm &&
          chart.bpm !== song.bpm && (
            <span
              key={difficulties[index].key}
              title={`${difficulties[index].name}限定BPM`}
              className={`ml-1.5 font-bold ${difficulties[index].text}`}
            >
              {chart.bpm}
            </span>
          ),
      )}
    </>
  );
  return (
    <dl
      className={`grid grid-cols-2 gap-3 ${card ? "mb-3" : "mt-1.5 text-xs sm:mt-2.5"}`}
    >
      {[
        ["ジャンル", song.genre],
        ["BPM", bpm],
      ].map(([label, value], index) => (
        <div key={index} className="min-w-0 truncate">
          <dt
            className={
              card
                ? "text-xs text-zinc-500 dark:text-zinc-400"
                : "mr-1 inline text-zinc-400 dark:text-zinc-500"
            }
          >
            {label}
          </dt>
          <dd
            className={`font-medium tabular-nums ${card ? "truncate text-sm text-zinc-800 dark:text-zinc-200" : "inline text-zinc-700 dark:text-zinc-300"}`}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const SongItem = memo(function SongItem({
  song,
  card,
  onOpenSong,
  virtual = false,
}: {
  song: CatalogSong;
  card: boolean;
  onOpenSong: OpenSong;
  virtual?: boolean;
}) {
  if (card) {
    return (
      <article
        className={`${panelClass} ${virtual ? "" : cardRendering} w-full min-w-0 cursor-pointer dark:shadow-lg`}
        onClick={() => onOpenSong(song)}
      >
        <div className="border-b border-zinc-200 p-3 dark:border-zinc-700">
          <SongTitle song={song} card onOpenSong={onOpenSong} />
        </div>
        <div className="p-3">
          <SongDetails song={song} card />
          <ChartCells song={song} card onOpenSong={onOpenSong} />
        </div>
      </article>
    );
  }

  return (
    <article
      className={`${listColumns} cursor-pointer py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/40`}
      onClick={() => onOpenSong(song)}
    >
      <div className="min-w-0">
        <SongTitle song={song} card={false} onOpenSong={onOpenSong} />
        <SongDetails song={song} card={false} />
      </div>
      <ChartCells song={song} card={false} onOpenSong={onOpenSong} />
    </article>
  );
});

type VersionGroup = { version: string; songs: CatalogSong[] };
const virtualizationThreshold = 32;

function VersionHeading({ version, count }: { version: string; count: number }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
        {version}
      </h2>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{count}曲</span>
      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

function CardGroup({ version, songs, onOpenSong }: VersionGroup & { onOpenSong: OpenSong }) {
  return (
    <section>
      <VersionHeading version={version} count={songs.length} />
      <div className="@container">
        <div className="grid grid-cols-1 gap-3 @[760px]:grid-cols-2 @[1140px]:grid-cols-3">
          {songs.map((song) => <SongItem key={song.id} song={song} card onOpenSong={onOpenSong} />)}
        </div>
      </div>
    </section>
  );
}

function ListColumnHeading() {
  return (
    <div className={`${listColumns} bg-zinc-50 py-2 text-xs font-bold dark:bg-zinc-900/60`}>
      <div className="text-zinc-500 dark:text-zinc-400">楽曲情報</div>
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {difficulties.map(({ key, label, text }) => <span key={key} className={text}>{label}</span>)}
      </div>
    </div>
  );
}

function ShortSongList({ groups, onOpenSong }: { groups: VersionGroup[]; onOpenSong: OpenSong }) {
  return (
    <div className="space-y-6">
      {groups.map(({ version, songs }) => (
        <section key={version}>
          <VersionHeading version={version} count={songs.length} />
          <div className={`${panelClass} overflow-x-auto`} tabIndex={0} role="region" aria-label={`${version}の楽曲一覧`}>
            <div className="min-w-[680px] divide-y divide-zinc-200 dark:divide-zinc-700">
              <ListColumnHeading />
              {songs.map((song) => <SongItem key={song.id} song={song} card={false} onOpenSong={onOpenSong} />)}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function VirtualSongList({ groups, onOpenSong, card }: { groups: VersionGroup[]; onOpenSong: OpenSong; card: boolean }) {
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>();
  const [columns, setColumns] = useState<number>();
  const container = useRef<HTMLDivElement>(null);
  const { items, groupLayout } = useMemo(() => ({
    items: groups.flatMap(({ version, songs }, groupIndex) => [
      { type: "heading" as const, id: `heading:${version}`, version, count: songs.length, groupIndex },
      ...(card ? Array.from({ length: Math.ceil(songs.length / (columns ?? 1)) }, (_, index) => {
        const start = index * (columns ?? 1);
        const end = start + (columns ?? 1);
        return {
          type: "cards" as const,
          id: `cards:${songs[start].id}`,
          songs: songs.slice(start, end),
          lastInGroup: end >= songs.length,
        };
      }) : songs.map((song, index) => ({
        type: "song" as const,
        id: song.id,
        song,
        lastInGroup: index === songs.length - 1,
      }))),
    ]),
    // Reset cached group heights when filtering changes where the headers fall.
    groupLayout: JSON.stringify(groups.map(({ version, songs }) => [version, songs.length])),
  }), [groups, card, columns]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 48rem)");
    function updateScrollParent() {
      setScrollParent(desktop.matches ? document.getElementById("main-content") : null);
    }
    updateScrollParent();
    desktop.addEventListener("change", updateScrollParent);
    return () => desktop.removeEventListener("change", updateScrollParent);
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!card || !element) return;

    function updateColumns(width: number) {
      setColumns(width >= 1140 ? 3 : width >= 760 ? 2 : 1);
    }

    updateColumns(element.clientWidth);
    const observer = new ResizeObserver(([entry]) => updateColumns(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [card]);

  const ready = scrollParent !== undefined && (!card || columns !== undefined);

  return (
    <div
      ref={container}
      className={card ? "min-w-0" : "min-w-0 overflow-x-auto overflow-y-hidden"}
      tabIndex={card ? undefined : 0}
      role="region"
      aria-label={card ? "楽曲カード" : "楽曲一覧"}
      data-virtualized-list
    >
      {!ready ? <SearchResultsLoading /> : (
      <Virtuoso
        key={`${scrollParent ? "desktop" : "mobile"}:${card ? columns : "list"}:${groupLayout}`}
        className={card ? undefined : "min-w-[680px]"}
        data={items}
        customScrollParent={scrollParent ?? undefined}
        useWindowScroll={scrollParent === null}
        initialItemCount={Math.min(10, items.length)}
        defaultItemHeight={card ? 206 : 88}
        increaseViewportBy={240}
        computeItemKey={(_index, item) => item.id}
        itemContent={(_index, item) => {
          if (item.type === "heading") {
            return (
              <div className={item.groupIndex > 0 ? "pt-6" : undefined}>
                <VersionHeading version={item.version} count={item.count} />
                {!card && (
                  <div className="overflow-hidden rounded-t-md border border-zinc-200 dark:border-zinc-700">
                    <ListColumnHeading />
                  </div>
                )}
              </div>
            );
          }
          if (item.type === "cards") {
            return (
              <div
                className={`grid gap-3 ${item.lastInGroup ? "" : "pb-3"}`}
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {item.songs.map((song) => <SongItem key={song.id} song={song} card virtual onOpenSong={onOpenSong} />)}
              </div>
            );
          }
          return (
            <div className={`border-x border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 ${item.lastInGroup ? "overflow-hidden rounded-b-md" : ""}`}>
              <SongItem song={item.song} card={false} onOpenSong={onOpenSong} />
            </div>
          );
        }}
      />
      )}
    </div>
  );
}

const ResultList = memo(function ResultList({
  songs,
  card,
  onOpenSong,
}: {
  songs: CatalogSong[];
  card: boolean;
  onOpenSong: OpenSong;
}) {
  const groups = useMemo(() => {
    const byVersion = new Map<string, CatalogSong[]>();
    for (const song of songs) {
      const group = byVersion.get(song.version);
      if (group) group.push(song);
      else byVersion.set(song.version, [song]);
    }
    return Array.from(byVersion, ([version, songs]) => ({ version, songs }));
  }, [songs]);

  if (songs.length === 0) {
    return (
      <p className={`${panelClass} p-8 text-center text-sm text-zinc-500 dark:text-zinc-400`}>
        条件に一致する楽曲が見つかりませんでした。
      </p>
    );
  }

  if (card && songs.length <= virtualizationThreshold) {
    return (
      <div className="space-y-6">
        {groups.map((group) => <CardGroup key={group.version} {...group} onOpenSong={onOpenSong} />)}
      </div>
    );
  }
  return songs.length <= virtualizationThreshold
    ? <ShortSongList groups={groups} onOpenSong={onOpenSong} />
    : <VirtualSongList key={card ? "cards" : "list"} groups={groups} onOpenSong={onOpenSong} card={card} />;
});
export const SearchResults = memo(function SearchResults({
  songs,
  total,
  loading,
  onOpenSong,
}: {
  songs: CatalogSong[];
  total: number;
  loading: boolean;
  onOpenSong: OpenSong;
}) {
  const [view, setView] = useState<(typeof views)[number]["value"]>("list");
  const deferredView = useDeferredValue(view);
  if (loading) return <SearchResultsLoading />;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <span>
            検索結果:{" "}
            <strong className="text-base font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
              {songs.length.toLocaleString("ja-JP")}
            </strong>{" "}
            曲
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            全{" "}
            <span className="font-medium tabular-nums">
              {total.toLocaleString("ja-JP")}
            </span>{" "}
            曲
          </span>
        </div>
        <div
          role="group"
          aria-label="検索結果の表示形式"
          className="flex items-center gap-1 rounded-sm border border-zinc-200 bg-white p-1 transition-colors dark:border-zinc-700 dark:bg-zinc-800"
        >
          {views.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs leading-none font-bold transition-colors ${view === value ? selectedClass : idleClass}`}
            >
              <span
                className="material-symbols-outlined text-base!"
                aria-hidden="true"
              >
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <ResultList
        songs={songs}
        card={deferredView === "card"}
        onOpenSong={onOpenSong}
      />
    </>
  );
});
