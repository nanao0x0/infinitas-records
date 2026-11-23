import { useState, type ReactNode } from 'react'
import { PlayStyleContext, type PlayStyle } from './playStyle'

const storageKey = 'infinitas-records.playStyle'

function readPlayStyle(): PlayStyle {
  try {
    return window.localStorage.getItem(storageKey) === 'DP' ? 'DP' : 'SP'
  } catch {
    return 'SP'
  }
}

export function PlayStyleProvider({ children }: { children: ReactNode }) {
  const [playStyle, setCurrentPlayStyle] = useState(readPlayStyle)

  function setPlayStyle(style: PlayStyle) {
    setCurrentPlayStyle(style)
    try {
      window.localStorage.setItem(storageKey, style)
    } catch {
      // The current selection remains available even if storage is disabled.
    }
  }

  return (
    <PlayStyleContext.Provider value={{ playStyle, setPlayStyle }}>
      {children}
    </PlayStyleContext.Provider>
  )
}
