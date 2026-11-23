import { useEffect, useState } from 'react'
import { useModalDialog } from './useModalDialog'
import './dialogMotion.css'

export function useSlideDialog(onClose: () => void) {
  const [closing, setClosing] = useState(false)
  const dialogProps = useModalDialog(requestClose)

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(onClose, 200)
    return () => window.clearTimeout(timer)
  }, [closing, onClose])

  function requestClose() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) onClose()
    else setClosing(true)
  }

  return {
    requestClose,
    dialogProps: {
      ...dialogProps,
      'data-closing': closing || undefined,
    },
  }
}
