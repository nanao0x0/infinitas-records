import { panelClass } from './dashboardData'
import { summaryGridClass } from './dashboardPresentation'

function Block({ className }: { className: string }) {
  return <div className={`rounded bg-zinc-200 dark:bg-zinc-700 ${className}`} />
}

function TrendSkeleton() {
  return (
    <div className="flex h-full flex-col justify-between gap-4 px-3 py-4">
      <div className="flex flex-1 flex-col justify-between border-l border-zinc-200 dark:border-zinc-700">
        {[0, 1, 2, 3, 4].map((line) => (
          <div key={line} className="border-b border-zinc-200 dark:border-zinc-700" />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {[0, 1, 2, 3].map((label) => <Block key={label} className="h-2.5 w-10" />)}
      </div>
    </div>
  )
}

export function DashboardTrendLoading() {
  return (
    <>
      <p role="status" className="sr-only">過去のプレーデータを集計中…</p>
      <div aria-hidden="true" className="h-full motion-safe:animate-pulse"><TrendSkeleton /></div>
    </>
  )
}

export function DashboardLoading() {
  return (
    <div>
      <p role="status" className="sr-only">プレーデータを集計中…</p>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className={summaryGridClass}>
          {[0, 1, 2, 3].map((card) => (
            <div key={card} className={`${panelClass} p-4`}>
              <div className="flex items-center justify-between gap-2">
                <Block className="h-3 w-24" />
                <Block className="size-4" />
              </div>
              <Block className="mt-3 h-6 w-20" />
              <Block className="mt-2 h-3 w-28 max-w-full" />
            </div>
          ))}
        </div>
        <div className={`${panelClass} divide-y divide-zinc-200 dark:divide-zinc-700`}>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="space-y-2">
              <Block className="h-4 w-20" />
              <Block className="h-3 w-32 sm:w-48" />
            </div>
            <Block className="hidden h-7 w-32 sm:block" />
          </div>
          {[0, 1].map((row) => (
            <div key={row} className="flex items-center justify-between gap-6 px-4 py-3">
              <Block className="h-4 w-2/5" />
              <Block className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className={`${panelClass} p-4 lg:col-span-8`}>
            <Block className="mb-3 h-4 w-32" />
            <div className="h-72"><TrendSkeleton /></div>
          </div>
          <div className={`${panelClass} p-4 lg:col-span-4`}>
            <Block className="mb-3 h-4 w-24" />
            <div className="grid h-52 place-items-center">
              <div className="size-36 rounded-full border-[18px] border-zinc-200 dark:border-zinc-700" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((label) => <Block key={label} className="h-3 w-full" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
