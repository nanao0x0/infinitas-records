import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const storageKey = 'infinitas-records.theme'
const darkModeQuery = '(prefers-color-scheme: dark)'

function readSavedTheme(): Theme | null {
  try {
    const theme = window.localStorage.getItem(storageKey)
    return theme === 'light' || theme === 'dark' ? theme : null
  } catch {
    return null
  }
}

export function useTheme() {
  const [savedTheme, setSavedTheme] = useState(readSavedTheme)
  const [deviceIsDark, setDeviceIsDark] = useState(
    () => window.matchMedia(darkModeQuery).matches,
  )

  useEffect(() => {
    if (savedTheme !== null) return

    const deviceTheme = window.matchMedia(darkModeQuery)
    function updateDeviceTheme() {
      setDeviceIsDark(deviceTheme.matches)
    }

    deviceTheme.addEventListener('change', updateDeviceTheme)
    updateDeviceTheme()
    return () => deviceTheme.removeEventListener('change', updateDeviceTheme)
  }, [savedTheme])

  const isDark = savedTheme === null ? deviceIsDark : savedTheme === 'dark'

  function toggleTheme() {
    const nextTheme = isDark ? 'light' : 'dark'
    setSavedTheme(nextTheme)

    try {
      window.localStorage.setItem(storageKey, nextTheme)
    } catch {
      // Keep the selected theme for this page when storage is unavailable.
    }
  }

  return { isDark, toggleTheme }
}
