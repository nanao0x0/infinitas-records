import { useModalDialog } from '../../components/layout/useModalDialog'
import type { Snapshot } from './snapshotStore'
import './snapshotFeedback.css'

export type ToastMessage = {
  text: string
  icon: 'check_circle' | 'delete' | 'error'
}

type SnapshotConfirmationProps = {
  title: string
  description: string
  snapshots: Snapshot[]
  busy: boolean
  closing: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function SnapshotConfirmation({
  title, description, snapshots, busy, closing, onCancel, onConfirm,
}: SnapshotConfirmationProps) {
  const dialogProps = useModalDialog(() => { if (!busy) onCancel() })
  const visibleSnapshots = snapshots.slice(0, 4)

  return (
    <dialog
      {...dialogProps}
      data-closing={closing || undefined}
      aria-labelledby="snapshot-confirm-title"
      aria-describedby="snapshot-confirm-description"
      className="snapshot-confirmation fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg backdrop:bg-zinc-900/45 backdrop:backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800 dark:backdrop:bg-black/70"
    >
      <div className="flex items-start gap-3 px-5 pt-5 pb-3">
        <span className="material-symbols-outlined flex! size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-xl! text-red-600 dark:bg-red-950/60 dark:text-red-400" aria-hidden="true">warning</span>
        <div className="min-w-0">
          <h2 id="snapshot-confirm-title" className="text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <p id="snapshot-confirm-description" className="mt-1.5 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-300">{description}</p>
        </div>
      </div>
      <ul className="mx-5 my-2 space-y-1 rounded-md border border-zinc-200 bg-zinc-100 px-3.5 py-2.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
        {visibleSnapshots.map(({ id, name }) => (
          <li key={id} className="font-bold wrap-anywhere">{name}</li>
        ))}
        {snapshots.length > visibleSnapshots.length && (
          <li className="text-zinc-500 dark:text-zinc-400">他{snapshots.length - visibleSnapshots.length}件</li>
        )}
      </ul>
      <div className="flex items-center justify-end gap-2 px-5 py-4">
        <button type="button" autoFocus disabled={busy} onClick={onCancel} className="cursor-pointer rounded-sm border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
          キャンセル
        </button>
        <button type="button" disabled={busy} onClick={onConfirm} className="cursor-pointer rounded-sm bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
          削除する
        </button>
      </div>
    </dialog>
  )
}

export function SnapshotToast({ message, closing }: { message: ToastMessage | null; closing: boolean }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-5 bottom-5 left-5 z-50 flex justify-end">
      {message && (
        <div data-closing={closing || undefined} className="snapshot-toast flex items-center gap-2.5 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-bold text-zinc-50 shadow-lg sm:text-sm dark:border-zinc-300 dark:bg-zinc-100 dark:text-zinc-900">
          <span className="material-symbols-outlined text-lg!" aria-hidden="true">{message.icon}</span>
          {message.text}
        </div>
      )}
    </div>
  )
}
