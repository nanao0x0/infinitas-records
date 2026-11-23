import { useRef } from 'react'
import type { SearchTarget } from './songFilters'

const searchTargets = [
  { value: 'title', label: '曲名' },
  { value: 'artist', label: 'アーティスト' },
] as const

type SearchBarProps = {
  target: SearchTarget
  keyword: string
  onTargetChange: (target: SearchTarget) => void
  onKeywordChange: (keyword: string) => void
}

export function SearchBar({ target, keyword, onTargetChange, onKeywordChange }: SearchBarProps) {
  const keywordInput = useRef<HTMLInputElement>(null)
  const placeholder = target === 'title' ? '曲名を入力' : 'アーティスト名を入力'

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 sm:flex-nowrap">
      <div role="group" aria-label="検索対象" className="flex w-fit rounded-sm border border-zinc-200 bg-white p-1 transition-colors dark:border-zinc-700 dark:bg-zinc-800">
        {searchTargets.map(({ value, label }) => (
          <button key={value} type="button" aria-pressed={value === target} onClick={() => onTargetChange(value)}
            className={`cursor-pointer rounded-sm px-3 py-2.5 text-xs leading-none font-bold whitespace-nowrap transition-colors sm:p-3 sm:text-sm ${value === target
              ? 'bg-zinc-500 text-white dark:bg-zinc-100 dark:text-zinc-800'
              : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="relative w-full sm:flex-1">
        <input ref={keywordInput} type="text" value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder={placeholder} aria-label={placeholder}
          className="w-full rounded-sm border border-zinc-200 bg-white p-2.5 pr-9 text-sm text-zinc-800 transition-colors placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-zinc-500 focus:outline-none sm:p-3 sm:pr-9 sm:text-base dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
        {keyword && (
          <button type="button" aria-label="キーワードをクリア" className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            onClick={() => {
              onKeywordChange('')
              keywordInput.current?.focus()
            }}>
            <span className="material-symbols-outlined text-xl!" aria-hidden="true">close</span>
          </button>
        )}
      </div>
    </div>
  )
}
