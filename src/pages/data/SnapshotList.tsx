import { useState, type ReactNode } from "react";
import type { PlayStyle } from "../../settings/playStyle";
import type { Snapshot } from "./snapshotStore";

type SnapshotListProps = {
  playStyle: PlayStyle;
  snapshots: Snapshot[];
  busy: boolean;
  canExport: boolean;
  onExport: () => void;
  onDownload: (id: string) => void;
  onDelete: (snapshots: Snapshot[]) => void;
};

const initialRowCount = 10;
const rowButtonClass =
  "inline-flex cursor-pointer items-center rounded-sm border border-zinc-200 bg-zinc-50 py-1.5 transition-colors disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900";

const snapshotDate = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type SelectionCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  children?: ReactNode;
};

function SelectionCheckbox({
  checked,
  onChange,
  label,
  children,
}: SelectionCheckboxProps) {
  return (
    <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs font-bold text-zinc-700 select-none dark:text-zinc-200">
      <span className="relative inline-flex size-4 items-center justify-center">
        <input
          type="checkbox"
          aria-label={label}
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="size-4 rounded-sm border border-zinc-300 bg-white transition-colors peer-checked:border-sky-600 peer-checked:bg-sky-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 dark:border-zinc-600 dark:bg-zinc-900 dark:peer-checked:border-sky-500 dark:peer-checked:bg-sky-500" />
        <span
          className="material-symbols-outlined pointer-events-none absolute text-[14px]! leading-none text-white opacity-0 peer-checked:opacity-100"
          aria-hidden="true"
        >
          check
        </span>
      </span>
      {children}
    </label>
  );
}

type SnapshotRowProps = {
  snapshot: Snapshot;
  latest: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  busy: boolean;
  onDownload: () => void;
  onDelete: () => void;
};

function SnapshotRow({
  snapshot,
  latest,
  selected,
  onSelect,
  busy,
  onDownload,
  onDelete,
}: SnapshotRowProps) {
  const rowColor = selected
    ? "bg-sky-50/60 dark:bg-sky-950/20"
    : "hover:bg-zinc-50 dark:hover:bg-zinc-700/30";

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors sm:flex-nowrap ${rowColor}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SelectionCheckbox
          checked={selected}
          onChange={onSelect}
          label={`${snapshot.name} のプレーデータを選択`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <time
              dateTime={new Date(snapshot.savedAt).toISOString()}
              className="text-xs font-bold text-zinc-900 tabular-nums sm:text-sm dark:text-zinc-50"
            >
              {snapshotDate.format(snapshot.savedAt)}
            </time>
            {latest && (
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                最新
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 truncate">
              <span
                className="material-symbols-outlined text-sm!"
                aria-hidden="true"
              >
                {snapshot.method === "file" ? "description" : "edit_note"}
              </span>
              <span className="truncate">{snapshot.name}</span>
            </span>
            <span
              className="text-zinc-300 dark:text-zinc-600"
              aria-hidden="true"
            >
              /
            </span>
            <span className="tabular-nums">
              {snapshot.songCount.toLocaleString("ja-JP")}曲
            </span>
            <span
              className="text-zinc-300 dark:text-zinc-600"
              aria-hidden="true"
            >
              /
            </span>
            <span className="tabular-nums">
              {(snapshot.size / 1024).toLocaleString("ja-JP", {
                maximumFractionDigits: 1,
              })}
              KB
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={onDownload}
          title="CSVをダウンロード"
          aria-label="CSVをダウンロード"
          className={`${rowButtonClass} gap-1 px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700`}
        >
          <span
            className="material-symbols-outlined text-base!"
            aria-hidden="true"
          >
            download
          </span>
          <span className="hidden sm:inline">DL</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          title="削除"
          aria-label="削除"
          className={`${rowButtonClass} justify-center px-2 text-zinc-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400`}
        >
          <span
            className="material-symbols-outlined text-base!"
            aria-hidden="true"
          >
            delete
          </span>
        </button>
      </div>
    </li>
  );
}

export function SnapshotList({
  playStyle,
  snapshots,
  busy,
  canExport,
  onExport,
  onDownload,
  onDelete,
}: SnapshotListProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const visibleSnapshots = expanded
    ? snapshots
    : snapshots.slice(0, initialRowCount);
  const remainingCount = snapshots.length - initialRowCount;
  const selectedSnapshots = snapshots.filter(({ id }) => selectedIds.has(id));
  const selectedCount = selectedSnapshots.length;
  const allSelected =
    snapshots.length > 0 && selectedCount === snapshots.length;

  function selectSnapshot(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white transition-colors dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-xl! text-zinc-500 dark:text-zinc-400"
            aria-hidden="true"
          >
            history
          </span>
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
            保存済みCSV一覧（{playStyle}）
          </h2>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {snapshots.length}件
          </span>
        </div>
        <button
          type="button"
          disabled={busy || !canExport}
          onClick={onExport}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 transition-colors enabled:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-700/60 dark:text-zinc-100 dark:enabled:hover:bg-zinc-700"
        >
          <span
            className="material-symbols-outlined text-base!"
            aria-hidden="true"
          >
            folder_zip
          </span>
          ZIPで一括エクスポート
        </button>
      </div>
      {snapshots.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <SelectionCheckbox
              checked={allSelected}
              onChange={(checked) =>
                setSelectedIds(
                  new Set(checked ? snapshots.map(({ id }) => id) : []),
                )
              }
              label="すべて選択"
            >
              <span>すべて選択</span>
            </SelectionCheckbox>
            <span
              aria-live="polite"
              className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400"
            >
              {selectedCount} 件選択中
            </span>
          </div>
          <button
            type="button"
            disabled={busy || selectedCount === 0}
            onClick={() => onDelete(selectedSnapshots)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors enabled:hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span
              className="material-symbols-outlined text-base!"
              aria-hidden="true"
            >
              delete_sweep
            </span>
            <span>選択削除</span>
          </button>
        </div>
      )}
      <div className="relative">
        {snapshots.length === 0 && (
          <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {playStyle} の保存済みプレーデータはまだありません。
          </p>
        )}
        <ul
          id="snapshot-rows"
          className="divide-y divide-zinc-200 dark:divide-zinc-700"
        >
          {visibleSnapshots.map((snapshot, index) => (
            <SnapshotRow
              key={snapshot.id}
              snapshot={snapshot}
              latest={index === 0}
              selected={selectedIds.has(snapshot.id)}
              onSelect={(checked) => selectSnapshot(snapshot.id, checked)}
              busy={busy}
              onDownload={() => onDownload(snapshot.id)}
              onDelete={() => onDelete([snapshot])}
            />
          ))}
        </ul>
        {remainingCount > 0 && (
          <div
            className={
              expanded
                ? "border-t border-zinc-200 bg-zinc-50 px-4 py-2.5 text-center dark:border-zinc-700 dark:bg-zinc-900/40"
                : "pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-center bg-linear-to-t from-white via-white/90 to-transparent pb-4 dark:from-zinc-800 dark:via-zinc-800/90"
            }
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="snapshot-rows"
              className={`pointer-events-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 bg-white text-xs font-bold transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 ${
                expanded
                  ? "px-4 py-1.5 text-zinc-700 shadow-sm dark:border-zinc-700 dark:text-zinc-200"
                  : "px-5 py-2 text-zinc-800 shadow-md dark:border-zinc-600 dark:text-zinc-100"
              }`}
              onClick={() => setExpanded(!expanded)}
            >
              <span
                className="material-symbols-outlined text-base!"
                aria-hidden="true"
              >
                {expanded ? "expand_less" : "expand_more"}
              </span>
              <span>{expanded ? "閉じる" : "もっと見る"}</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                {expanded ? `最新${initialRowCount}件` : `+${remainingCount}件`}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
