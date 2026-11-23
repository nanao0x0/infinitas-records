import { useEffect, useRef, type MouseEvent, type PointerEvent, type SyntheticEvent } from 'react'

function isBackdrop(event: MouseEvent<HTMLDialogElement> | PointerEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return false
  const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
  return event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom
}

export function useModalDialog(onDismiss: () => void) {
  const dialog = useRef<HTMLDialogElement>(null)
  const backdropDown = useRef(false)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  return {
    ref: dialog,
    onCancel: (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault()
      onDismiss()
    },
    onPointerDown: (event: PointerEvent<HTMLDialogElement>) => { backdropDown.current = isBackdrop(event) },
    onClick: (event: MouseEvent<HTMLDialogElement>) => {
      const dismiss = backdropDown.current && isBackdrop(event)
      backdropDown.current = false
      if (dismiss) onDismiss()
    },
  }
}
