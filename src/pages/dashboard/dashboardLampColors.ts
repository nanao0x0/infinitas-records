import { lampColors } from './dashboardData'

const darkLampColors = { ...lampColors, FAILED: '#7894b9' }

export function getLampColors(isDark: boolean) {
  return isDark ? darkLampColors : lampColors
}
