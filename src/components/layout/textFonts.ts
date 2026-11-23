function loadTextFontStyles() {
  const link = document.querySelector<HTMLLinkElement>('#text-font-styles')
  if (!link) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const apply = () => {
      link.media = 'all'
      resolve()
    }

    if (link.sheet) apply()
    else {
      // The print-only stylesheet can download without holding up the screen.
      link.addEventListener('load', apply, { once: true })
      link.addEventListener('error', () => resolve(), { once: true })
    }
  })
}

export const textFontStylesReady = loadTextFontStyles()
