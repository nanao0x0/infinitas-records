import { useId } from "react";
import { useSlideDialog } from "../../components/layout/useSlideDialog";
import { DashboardIcon } from "./dashboardPresentation";
import type { ComparisonPair, ComparisonSnapshot } from "./dashboardData";

const presetClass =
  "rounded-sm border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors enabled:cursor-pointer enabled:hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:enabled:hover:bg-zinc-700";

function SnapshotSelect({
  label,
  snapshots,
  value,
  onChange,
  latestId,
}: {
  label: string;
  snapshots: ComparisonSnapshot[];
  value: string;
  onChange: (id: string) => void;
  latestId?: string;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-300"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={!snapshots.length}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-sm border border-zinc-200 bg-zinc-50 py-2 pr-9 pl-3 text-xs font-medium text-zinc-800 transition-colors enabled:cursor-pointer hover:border-zinc-300 focus:ring-2 focus:ring-zinc-400/50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600"
        >
          {snapshots.length ? (
            snapshots.map((snapshot) => (
              <option key={snapshot.id} value={snapshot.id}>
                {snapshot.label}
                {snapshot.id === latestId ? "（最新）" : ""}
              </option>
            ))
          ) : (
            <option value="">選択できるプレーデータがありません</option>
          )}
        </select>
        <DashboardIcon
          name="expand_more"
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-base! text-zinc-400"
        />
      </div>
    </div>
  );
}

export function DashboardComparisonModal({
  snapshots,
  historyLoading,
  pair,
  onChange,
  onClose,
}: {
  snapshots: ComparisonSnapshot[];
  historyLoading: boolean;
  pair?: ComparisonPair;
  onChange: (pair: ComparisonPair) => void;
  onClose: () => void;
}) {
  const { dialogProps, requestClose } = useSlideDialog(onClose);
  const titleId = useId();
  const from = snapshots.findIndex(({ id }) => id === pair?.fromId);
  const to = snapshots.findIndex(({ id }) => id === pair?.toId);

  function selectPreset(index: number) {
    if (snapshots[index])
      onChange({ fromId: snapshots[index].id, toId: snapshots[0].id });
  }

  return (
    <dialog
      {...dialogProps}
      aria-labelledby={titleId}
      className="slide-dialog fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-md border border-zinc-200 bg-white font-dashboard shadow-2xl backdrop:bg-zinc-900/45 backdrop:backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800 dark:backdrop:bg-black/70"
    >
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
        <h2
          id={titleId}
          className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50"
        >
          <DashboardIcon
            name="compare_arrows"
            className="text-xl! text-emerald-500"
          />
          比較対象のプレーデータを選択
        </h2>
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
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            クイック選択:
          </span>
          <button
            type="button"
            disabled={!pair}
            onClick={() => selectPreset(1)}
            className={presetClass}
          >
            最新 vs 1つ前
          </button>
          <button
            type="button"
            disabled={!pair || historyLoading}
            onClick={() => selectPreset(snapshots.length - 1)}
            className={presetClass}
          >
            最新 vs 最古
          </button>
        </div>
        {historyLoading && <p role="status" className="text-xs text-zinc-500 dark:text-zinc-400">過去のプレーデータを読み込み中…</p>}
        <div className="space-y-3">
          <SnapshotSelect
            label="比較元（過去のプレーデータ）"
            snapshots={pair ? snapshots.slice(to + 1) : []}
            value={pair?.fromId ?? ""}
            onChange={(id) => {
              if (pair) onChange({ ...pair, fromId: id });
            }}
          />
          <SnapshotSelect
            label="比較先（新しいプレーデータ）"
            snapshots={pair ? snapshots.slice(0, from) : []}
            value={pair?.toId ?? ""}
            latestId={snapshots[0]?.id}
            onChange={(id) => {
              if (pair) onChange({ ...pair, toId: id });
            }}
          />
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {pair
            ? "※ 比較元には、比較先より古いプレーデータを選択してください。"
            : "比較にはプレーデータが2件必要です。"}
        </p>
        <div className="flex justify-end border-t border-zinc-100 pt-2 dark:border-zinc-700/70">
          <button
            type="button"
            onClick={requestClose}
            className="cursor-pointer rounded-sm bg-zinc-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            閉じる
          </button>
        </div>
      </div>
    </dialog>
  );
}
