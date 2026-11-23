import type { PlayStyle } from "../../settings/playStyle";
import { snapshotLimit } from "./snapshotStore";

type SnapshotQuotaProps = {
  playStyle: PlayStyle;
  count: number;
  skipConfirmation: boolean;
  onSkipConfirmationChange: (checked: boolean) => void;
};

export function SnapshotQuota({
  playStyle,
  count,
  skipConfirmation,
  onSkipConfirmationChange,
}: SnapshotQuotaProps) {
  const percent = Math.min(100, Math.round((count / snapshotLimit) * 100));
  const fillColor =
    count >= snapshotLimit
      ? "bg-red-500"
      : percent >= 85
        ? "bg-amber-500"
        : "bg-sky-600 dark:bg-sky-400";

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 transition-colors dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-100">
          <span className="rounded bg-zinc-600 px-2 py-0.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {playStyle}
          </span>
          <span>プレーデータ保存数</span>
        </h2>
        <div className="text-sm tabular-nums">
          <strong className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {count}
          </strong>{" "}
          <span className="text-zinc-400">/ {snapshotLimit} 件</span>{" "}
          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
            （残り {Math.max(0, snapshotLimit - count)} 件）
          </span>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="プレーデータ保存数"
        aria-valuenow={Math.min(count, snapshotLimit)}
        aria-valuemax={snapshotLimit}
        className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-700/70">
        <label className="group inline-flex cursor-pointer items-center gap-2.5 text-xs text-zinc-600 select-none dark:text-zinc-300">
          <span className="relative inline-flex shrink-0 items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={skipConfirmation}
              onChange={(event) =>
                onSkipConfirmationChange(event.target.checked)
              }
            />
            <span className="h-5 w-9 rounded-full bg-zinc-300 transition-colors peer-checked:bg-sky-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 dark:bg-zinc-700 dark:peer-checked:bg-sky-500" />
            <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </span>
          <span className="transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
            最大保存数（{snapshotLimit}件）を超えたときの削除確認を行わない
          </span>
        </label>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          ※ 超過時は最も古いデータから自動削除されます
        </span>
      </div>
    </section>
  );
}
