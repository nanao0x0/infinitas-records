type ThemeToggleProps = {
  isDark: boolean
  onToggle: () => void
  className: string
}

export function ThemeToggle({ isDark, onToggle, className }: ThemeToggleProps) {
  const label = isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'

  return (
    <button type="button" aria-label={label} title={label} className={className} onClick={onToggle}>
      <span className="material-symbols-outlined text-xl!" aria-hidden="true">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}
