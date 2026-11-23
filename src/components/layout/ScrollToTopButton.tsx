import { useEffect, useState } from 'react'

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const main = document.getElementById('main-content')

    function updateVisibility() {
      setVisible(window.scrollY > 0 || (main?.scrollTop ?? 0) > 0)
    }

    window.addEventListener('scroll', updateVisibility, { passive: true })
    main?.addEventListener('scroll', updateVisibility, { passive: true })
    updateVisibility()

    return () => {
      window.removeEventListener('scroll', updateVisibility)
      main?.removeEventListener('scroll', updateVisibility)
    }
  }, [])

  function scrollToTop() {
    const main = document.getElementById('main-content')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // A virtual list can adjust its measured height while a smooth scroll is running.
    const behavior = reducedMotion || main?.querySelector('[data-virtualized-list]') ? 'instant' : 'smooth'

    main?.focus({ preventScroll: true })
    if (main?.scrollTop) main.scrollTo({ top: 0, behavior })
    if (window.scrollY) window.scrollTo({ top: 0, behavior })
  }

  return (
    <button
      type="button"
      aria-label="ページ上部へ戻る"
      title="ページ上部へ戻る"
      onClick={scrollToTop}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed right-4 bottom-4 z-40 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-zinc-800 text-white shadow-lg hover:bg-zinc-700 motion-safe:transition-[opacity,translate,visibility,background-color] motion-safe:duration-200 md:right-8 md:bottom-6 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white ${visible
        ? 'visible opacity-100'
        : 'pointer-events-none invisible opacity-0 motion-safe:translate-y-2'}`}
    >
      <span className="mt-1 size-2.5 rotate-45 border-t-2 border-l-2 border-current" aria-hidden="true" />
    </button>
  )
}
