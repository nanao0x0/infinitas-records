import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePlayStyle } from '../../settings/playStyle'
import { SearchBar } from './SearchBar'
import { SearchOptions } from './SearchOptions'
import { SearchResultsLoading } from './SearchResultsLoading'
import { defaultFilters, type SearchTarget } from './songFilters'

const SongSearchResults = lazy(() => import('./SongSearchResults'))

export function SearchPage() {
  const { playStyle } = usePlayStyle()
  const [target, setTarget] = useState<SearchTarget>('title')
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const controls = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = controls.current
    if (!element) return
    const main = element.closest('main')
    let frame = 0
    let previousHeight = element.getBoundingClientRect().height
    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height
      if (height === previousHeight) return
      previousHeight = height
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // Virtuoso remeasures its offset on scroll, but moving the list alone does not emit a scroll event.
        const scroller = main && getComputedStyle(main).overflowY === 'auto' ? main : window
        scroller.dispatchEvent(new Event('scroll'))
      })
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="font-dashboard">
      <div ref={controls}>
        <PageHeader path="/search" className="mb-4 sm:mb-5" />
        <SearchBar target={target} keyword={keyword} onTargetChange={setTarget} onKeywordChange={setKeyword} />
        <SearchOptions filters={filters} onChange={setFilters} />
      </div>
      <Suspense fallback={<SearchResultsLoading />}>
        <SongSearchResults playStyle={playStyle} filters={filters} target={target} keyword={keyword} />
      </Suspense>
    </div>
  )
}
