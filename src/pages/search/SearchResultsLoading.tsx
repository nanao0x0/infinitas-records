export function SearchResultsLoading() {
  return (
    <section aria-busy="true" aria-label="楽曲一覧">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-300">楽曲を読み込み中…</p>
        <div aria-hidden="true" className="h-[38px] w-36 rounded-sm border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800" />
      </div>
      <div aria-hidden="true" className="space-y-2.5 motion-safe:animate-pulse">
        <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          <div className="h-8 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60" />
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {[0, 1, 2].map((row) => (
              <div key={row} className="grid h-20 items-center gap-4 px-4 sm:h-[89px] md:grid-cols-[minmax(0,1fr)_400px]">
                <div className="min-w-0 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-3 w-2/5 rounded bg-zinc-100 dark:bg-zinc-700/70" />
                  <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-700/70" />
                </div>
                <div className="hidden grid-cols-5 gap-1.5 md:grid">
                  {['B', 'N', 'H', 'A', 'L'].map((difficulty) => (
                    <span key={difficulty} className="h-14 rounded-md bg-zinc-100 dark:bg-zinc-900" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
