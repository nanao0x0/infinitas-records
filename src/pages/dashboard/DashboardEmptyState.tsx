import type { PlayStyle } from "../../settings/playStyle";
import { panelClass } from "./dashboardData";
import { DashboardIcon } from "./dashboardPresentation";

export function DashboardEmptyState({ playStyle }: { playStyle: PlayStyle }) {
  return (
    <section
      className={`${panelClass} flex flex-col items-center px-6 py-12 text-center sm:py-16`}
    >
      <div className="mb-6 grid size-14 place-items-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 ring-8 ring-sky-50/70 dark:border-sky-800 dark:bg-sky-950/70 dark:text-sky-300 dark:ring-sky-950/35">
        <DashboardIcon name="upload_file" className="text-3xl!" />
      </div>
      <h2 className="text-base font-bold text-zinc-900 sm:text-lg dark:text-zinc-50">
        {playStyle} のプレーデータがありません
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        公式サイトからダウンロードした CSV
        を登録すると、ここでプレー記録やスコアの変化を確認できます。
      </p>
      <a
        href="/data"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-zinc-800 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        データ管理へ
        <DashboardIcon name="arrow_forward" className="text-base!" />
      </a>
    </section>
  );
}
