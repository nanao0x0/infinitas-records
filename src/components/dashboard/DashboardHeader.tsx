import { PageHeader } from "../layout/PageHeader";

type DashboardHeaderProps = {
  snapshotLabel?: string;
};

export function DashboardHeader({ snapshotLabel }: DashboardHeaderProps) {
  return (
    <PageHeader path="/">
      {snapshotLabel && (
        <span className="rounded-sm border border-zinc-300 bg-zinc-200 px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          最新のプレーデータ: {snapshotLabel}
        </span>
      )}
    </PageHeader>
  );
}
