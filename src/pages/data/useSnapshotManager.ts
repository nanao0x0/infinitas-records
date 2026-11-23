import { useEffect, useRef, useState } from "react";
import type { PlayStyle } from "../../settings/playStyle";
import { prepareSnapshots, type CsvInput } from "./snapshotCsv";
import { downloadSnapshot, downloadSnapshotZip } from "./snapshotDownload";
import type { ToastMessage } from "./SnapshotFeedback";
import {
  deleteSnapshots,
  listSnapshots,
  saveSnapshots,
  type Snapshot,
  type StoredSnapshot,
} from "./snapshotStore";

const skipConfirmationKey = "infinitas-records.skipOverflowConfirmation";
const exitDuration = 200;

function shouldAnimate() {
  return window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
}

type Confirmation =
  | { kind: "delete"; snapshots: Snapshot[] }
  | {
      kind: "overflow";
      snapshots: Snapshot[];
      incoming: StoredSnapshot[];
      count: number;
    };

function readSkipConfirmation() {
  try {
    return localStorage.getItem(skipConfirmationKey) === "true";
  } catch {
    return false;
  }
}

export function useSnapshotManager(playStyle: PlayStyle) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [skipConfirmation, setSkipConfirmation] =
    useState(readSkipConfirmation);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmationClosing, setConfirmationClosing] = useState(false);
  const [toast, setToast] = useState<{
    message: ToastMessage;
    closing: boolean;
  } | null>(null);
  const [importVersion, setImportVersion] = useState(0);
  const operationInProgress = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const records = await listSnapshots();
        if (active) {
          setSnapshots(records);
          setLoadError(false);
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.removeEventListener("focus", load);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.closing
      ? exitDuration
      : toast.message.icon === "error"
        ? 5500
        : 3200;
    const timer = window.setTimeout(() => {
      setToast((current) => {
        if (current !== toast) return current;
        return toast.closing || !shouldAnimate()
          ? null
          : { ...toast, closing: true };
      });
    }, duration);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!confirmationClosing) return;
    const timer = window.setTimeout(() => {
      setConfirmation(null);
      setConfirmationClosing(false);
    }, exitDuration);
    return () => window.clearTimeout(timer);
  }, [confirmationClosing]);

  function closeConfirmation() {
    if (shouldAnimate()) setConfirmationClosing(true);
    else setConfirmation(null);
  }

  function showToast(message: ToastMessage) {
    setToast({ message, closing: false });
  }

  function reportError(text: string) {
    showToast({ text, icon: "error" });
  }

  function changeSkipConfirmation(checked: boolean) {
    setSkipConfirmation(checked);
    try {
      localStorage.setItem(skipConfirmationKey, String(checked));
    } catch {
      // Keep the setting for the current page if storage is unavailable.
    }
  }

  async function run(action: () => Promise<void>, fallback: string) {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      reportError(
        error instanceof Error && !(error instanceof DOMException)
          ? error.message
          : fallback,
      );
    } finally {
      operationInProgress.current = false;
      setBusy(false);
    }
  }

  async function storeSnapshots(
    incoming: StoredSnapshot[],
    allowEviction: boolean | string[],
  ) {
    const result = await saveSnapshots(incoming, allowEviction);
    if (!result.saved) {
      setConfirmation({
        kind: "overflow",
        snapshots: result.evictions,
        incoming,
        count: result.count,
      });
      return;
    }
    if (confirmation) closeConfirmation();
    if (!result.count) {
      reportError("登録するCSVがありません。");
      return;
    }
    setImportVersion((value) => value + 1);
    setSnapshots(await listSnapshots());
    const skipped = incoming.length - result.count;
    const message =
      incoming.length === 1
        ? "プレーデータを保存しました。"
        : `${result.count} 件のプレーデータを保存しました。`;
    showToast({
      text:
        message +
        (skipped
          ? `選択したCSVのうち、保存上限を超えた ${skipped} 件は取り込みませんでした。`
          : ""),
      icon: "check_circle",
    });
  }

  function importCsv(input: CsvInput) {
    void run(async () => {
      const incoming = await prepareSnapshots(input, playStyle);
      await storeSnapshots(incoming, skipConfirmation);
    }, "プレーデータを保存できませんでした。");
  }

  function confirm() {
    if (!confirmation || confirmationClosing) return;
    void run(async () => {
      if (confirmation.kind === "overflow") {
        await storeSnapshots(
          confirmation.incoming,
          confirmation.snapshots.map(({ id }) => id),
        );
      } else {
        const ids = confirmation.snapshots.map(({ id }) => id);
        const deleted = await deleteSnapshots(ids);
        closeConfirmation();
        setSnapshots(await listSnapshots());
        if (deleted) {
          showToast({
            text: `${deleted} 件のプレーデータを削除しました。`,
            icon: "delete",
          });
        } else {
          reportError("削除対象のプレーデータはすでに削除されています。");
        }
      }
    }, "処理を完了できませんでした。");
  }

  return {
    snapshots,
    loading,
    loadError,
    busy,
    skipConfirmation,
    changeSkipConfirmation,
    confirmation,
    confirmationClosing,
    importVersion,
    toast,
    reportError,
    importCsv,
    confirm,
    cancelConfirmation: closeConfirmation,
    requestDeletion: (items: Snapshot[]) =>
      setConfirmation({ kind: "delete", snapshots: items }),
    downloadCsv: (id: string) =>
      void run(
        () => downloadSnapshot(id),
        "CSVをダウンロードできませんでした。",
      ),
    exportZip: () =>
      void run(
        () => downloadSnapshotZip(playStyle),
        "ZIPをエクスポートできませんでした。",
      ),
  };
}
