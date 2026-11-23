import { PageHeader } from "../../components/layout/PageHeader";
import { usePlayStyle } from "../../settings/playStyle";
import { CsvImport } from "./CsvImport";
import { SnapshotConfirmation, SnapshotToast } from "./SnapshotFeedback";
import { SnapshotList } from "./SnapshotList";
import { SnapshotQuota } from "./SnapshotQuota";
import { useSnapshotManager } from "./useSnapshotManager";
import { snapshotLimit } from "./snapshotStore";

export function DataPage() {
  const { playStyle } = usePlayStyle();
  const manager = useSnapshotManager(playStyle);
  const snapshots = manager.snapshots.filter(
    (snapshot) => snapshot.playStyle === playStyle,
  );
  const disabled = manager.busy || manager.loading || manager.loadError;
  const confirmation = manager.confirmation;

  return (
    <div className="space-y-6 font-dashboard">
      <PageHeader path="/data" />
      {manager.loadError && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          保存データを読み込めませんでした。ブラウザのストレージ設定を確認して、ページを再読み込みしてください。
        </p>
      )}
      <SnapshotQuota
        playStyle={playStyle}
        count={snapshots.length}
        skipConfirmation={manager.skipConfirmation}
        onSkipConfirmationChange={manager.changeSkipConfirmation}
      />
      <CsvImport
        key={manager.importVersion}
        busy={disabled}
        onImport={manager.importCsv}
        onError={manager.reportError}
      />
      <SnapshotList
        key={playStyle}
        playStyle={playStyle}
        snapshots={snapshots}
        busy={disabled}
        canExport={snapshots.length > 0}
        onExport={manager.exportZip}
        onDownload={manager.downloadCsv}
        onDelete={manager.requestDeletion}
      />
      <section className="rounded-md border border-zinc-200 bg-white p-4 transition-colors sm:p-5 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-100">
          <span
            className="material-symbols-outlined text-xl! text-zinc-500 dark:text-zinc-400"
            aria-hidden="true"
          >
            info
          </span>
          ご利用上の説明・注意事項
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400 [&_strong]:text-zinc-800 dark:[&_strong]:text-zinc-200">
          <li>
            公式マイページからダウンロードした
            <strong>SP / DP それぞれのプレーデータCSV</strong>
            に対応しています（現在選択中のプレースタイル側に保存されます）。
          </li>
          <li>
            同じプレースタイルの CSV をまとめて取り込めます。
            <strong>選択した CSV の中だけ</strong>
            をファイル名の日時（なければファイルの更新日時）が新しい順に並べ、保存済み一覧の先頭に追加します。
          </li>
          <li>
            プレーデータは <strong>SP・DP 各{snapshotLimit}件まで</strong>
            保存できます。上限を超える場合は新しいデータから{snapshotLimit}
            件を残します。
          </li>
          <li>
            取り込んだデータはブラウザ上に保存されます。機種変更やキャッシュ削除に備えて、定期的に
            <strong>ZIPで一括エクスポート</strong>
            からバックアップを保存することをおすすめします。
          </li>
          <li>
            同じ内容・日時のCSVを取り込むと、別のプレーデータとして保存されます。不要なデータは一覧のゴミ箱アイコンから削除できます。
          </li>
        </ul>
      </section>
      {confirmation && (
        <SnapshotConfirmation
          title={`${confirmation.snapshots.length} 件のプレーデータを削除しますか？`}
          description={
            confirmation.kind === "overflow"
              ? `保存上限を超えるため、以下の古いプレーデータを削除して、CSVを ${confirmation.count} 件保存します。`
              : "削除したデータは元に戻せません。"
          }
          snapshots={confirmation.snapshots}
          busy={manager.busy || manager.confirmationClosing}
          closing={manager.confirmationClosing}
          onCancel={manager.cancelConfirmation}
          onConfirm={manager.confirm}
        />
      )}
      <SnapshotToast
        message={manager.toast?.message ?? null}
        closing={manager.toast?.closing ?? false}
      />
    </div>
  );
}
