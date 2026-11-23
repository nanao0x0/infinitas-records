import { useEffect, useRef, type ReactNode } from 'react'
import type { PagePath } from '../../navigation'
import { BrandMark } from './BrandMark'
import { Sidebar } from './Sidebar'
import { ScrollToTopButton } from './ScrollToTopButton'
import { ThemeToggle } from './ThemeToggle'
import { useSnapshotSummary } from './useSnapshotSummary'

const headerButtonClass =
  'grid size-9 shrink-0 cursor-pointer place-items-center rounded-full transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700'

type AppLayoutProps = {
  children?: ReactNode
  currentPath: PagePath
  isDark: boolean
  toggleTheme: () => void
}

export function AppLayout({ children, currentPath, isDark, toggleTheme }: AppLayoutProps) {
  const snapshotSummary = useSnapshotSummary()
  const drawer = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 48rem)')

    function closeDrawerOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) drawer.current?.close()
    }

    desktop.addEventListener('change', closeDrawerOnDesktop)
    return () => desktop.removeEventListener('change', closeDrawerOnDesktop)
  }, [])

  return (
    <div className={isDark ? 'dark' : undefined}>
      <div className="flex min-h-dvh flex-col bg-zinc-100 text-zinc-800 transition-colors dark:bg-zinc-900 dark:text-zinc-100">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 transition-colors dark:border-zinc-700 dark:bg-zinc-800 md:hidden">
          <div className="flex items-center gap-2.5">
            <BrandMark size={26} />
            <span className="font-logo text-xl leading-none tracking-wider text-zinc-800 dark:text-zinc-100">INFINITAS Records</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} className={headerButtonClass} />
            <button
              type="button"
              aria-label="メニューを開く"
              aria-haspopup="dialog"
              aria-controls="navigation-drawer"
              className={headerButtonClass}
              onClick={() => drawer.current?.showModal()}
            >
              <span className="material-symbols-outlined text-2xl!" aria-hidden="true">menu</span>
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col md:grid md:grid-cols-[246px_minmax(0,1fr)]">
          <aside className="sticky top-4 m-4 mr-0 hidden h-[calc(100dvh-2rem)] self-start overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white shadow-lg shadow-zinc-900/5 transition-colors dark:border-zinc-700/80 dark:bg-zinc-800 dark:shadow-black/30 md:block">
            <Sidebar currentPath={currentPath} isDark={isDark} onToggleTheme={toggleTheme} snapshotSummary={snapshotSummary} />
          </aside>

          <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 sm:p-6 md:h-dvh md:overflow-auto md:p-10 md:[scrollbar-gutter:stable]">
            <div className="mx-auto max-w-[1200px]">{children}</div>
          </main>
        </div>

        {currentPath === '/search' && <ScrollToTopButton />}

        <dialog
          ref={drawer}
          id="navigation-drawer"
          aria-label="サイトメニュー"
          className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[230px] max-w-full border-r border-zinc-200 bg-white text-inherit backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-800"
          onClick={(event) => {
            if (event.target === event.currentTarget) drawer.current?.close()
          }}
        >
          <Sidebar
            snapshotSummary={snapshotSummary}
            currentPath={currentPath}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onClose={() => drawer.current?.close()}
          />
        </dialog>
      </div>
    </div>
  )
}
