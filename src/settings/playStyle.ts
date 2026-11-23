import { createContext, useContext } from 'react'

export const playStyles = ['SP', 'DP'] as const
export type PlayStyle = (typeof playStyles)[number]

type PlayStyleSetting = {
  playStyle: PlayStyle
  setPlayStyle: (style: PlayStyle) => void
}

export const PlayStyleContext = createContext<PlayStyleSetting | null>(null)

export function usePlayStyle() {
  const setting = useContext(PlayStyleContext)
  if (setting === null) {
    throw new Error('usePlayStyle must be used inside PlayStyleProvider')
  }
  return setting
}
