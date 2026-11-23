import { difficulties, lamps } from '../search/searchPresentation'
import { lampLegendLabel, type Lamp } from './dashboardData'

export const summaryGridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'

export function DashboardIcon({ name, className = '' }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={`material-symbols-outlined shrink-0 ${className}`}>{name}</span>
}

export function PanelTitle({ title, icon, color, description }: {
  title: string; icon: string; color: string; description?: string
}) {
  return (
    <div className="min-w-0">
      <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-800 sm:text-base dark:text-zinc-100">
        <DashboardIcon name={icon} className={`text-xl! ${color}`} />
        {title}
      </h2>
      {description && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
    </div>
  )
}

export function PreviewSelect({ id, label, options, value, onChange }: {
  id?: string; label: string; options: readonly { value: string; label: string }[]; value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <select id={id} aria-label={label} value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none rounded-sm border border-zinc-200 bg-zinc-50 py-1.5 pr-8 pl-3 text-xs font-medium text-zinc-700 enabled:cursor-pointer focus:ring-2 focus:ring-zinc-400/50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select>
      <DashboardIcon name="expand_more" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-base! text-zinc-400" />
    </div>
  )
}

const fullLampNames: Record<Lamp, string> = {
  NO_PLAY: 'NO PLAY',
  FAILED: 'FAILED',
  ASSIST: 'ASSIST EASY',
  EASY: 'EASY',
  CLEAR: 'NORMAL',
  HARD: 'HARD',
  EX_HARD: 'EX HARD',
  FC: 'FULL COMBO',
}

export function LampBadge({ lamp, format = 'short' }: { lamp: Lamp; format?: 'short' | 'legend' | 'full' }) {
  const meta = lamps[lamp]
  const text = format === 'full' ? fullLampNames[lamp] : format === 'legend' ? lampLegendLabel(lamp) : meta.short
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${format === 'legend' ? "font-medium text-zinc-700 dark:text-zinc-200" : `font-bold ${meta.text}`}`}>
      <span className={`size-2.5 shrink-0 rounded-full ${meta.dot}`} />
      <span className="truncate">{text}</span>
    </span>
  )
}

export function DifficultyBadge({ diff, lv }: { diff: string; lv: number | null }) {
  const difficulty = difficulties.find((item) => item.name === diff)
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-sm px-1.5 py-0.5 text-[11px] leading-none font-bold text-white ${difficulty?.dot ?? 'bg-zinc-500'}`}>{difficulty?.key} {lv ?? '?'}</span>
  )
}

export function TrackTitle({ title, diff, lv, onOpen }: { title: string; diff: string; lv: number | null; onOpen: () => void }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <DifficultyBadge diff={diff} lv={lv} />
      <button type="button" title={title} aria-haspopup="dialog" onClick={onOpen}
        className="min-w-0 cursor-pointer truncate rounded-sm text-left text-sm font-bold text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-zinc-50">
        {title}
      </button>
    </div>
  )
}
