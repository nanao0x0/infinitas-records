import { useRef, useState } from "react";
import type { CsvInput } from "./snapshotCsv";

const inputModes = [
  { value: "file", label: "ファイル選択" },
  { value: "text", label: "テキスト入力" },
] as const;

type InputMode = (typeof inputModes)[number]["value"];

type CsvImportProps = {
  busy: boolean;
  onImport: (input: CsvInput) => void;
  onError: (message: string) => void;
};

export function CsvImport({ busy, onImport, onError }: CsvImportProps) {
  const [mode, setMode] = useState<InputMode>("file");
  const [csvText, setCsvText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function selectFiles(selection: FileList) {
    const selected = Array.from(selection);
    if (!selected.length) return;
    if (selected.some(({ name }) => !/\.csv$/i.test(name))) {
      setFiles([]);
      onError("CSVファイルを選択してください。");
      return;
    }
    setFiles(selected);
  }

  function submit() {
    if (mode === "file" && files.length) onImport({ files });
    if (mode === "text" && csvText.trim()) onImport({ text: csvText });
  }

  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white transition-colors dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-100">
          <span
            className="material-symbols-outlined text-xl! text-zinc-500 dark:text-zinc-400"
            aria-hidden="true"
          >
            upload_file
          </span>
          公式CSVの取り込み
        </h2>
        <div
          role="group"
          aria-label="入力方法"
          className="flex items-center gap-0.5 rounded-sm border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {inputModes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              className={`cursor-pointer rounded-sm px-3 py-1.5 text-xs font-bold transition-colors ${
                mode === value
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        {mode === "file" ? (
          <>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) selectFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                )
                  setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (!busy) selectFiles(event.dataTransfer.files);
              }}
              className={`block w-full cursor-pointer rounded-md border-2 border-dashed bg-zinc-50/70 p-6 text-center transition-colors sm:p-8 dark:bg-zinc-900/50 ${
                dragging
                  ? "border-sky-600 dark:border-sky-400"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
              }`}
            >
              <span
                className="material-symbols-outlined mb-2 text-4xl! text-zinc-400 dark:text-zinc-500"
                aria-hidden="true"
              >
                upload_file
              </span>
              <span className="block text-sm font-bold text-zinc-700 dark:text-zinc-200">
                CSVファイルをここにドラッグ＆ドロップ
              </span>
              <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                またはクリックしてファイルを選択（.csv・複数選択可）
              </span>
              {files.length > 0 && (
                <span className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  <span
                    className="material-symbols-outlined text-sm! text-sky-600 dark:text-sky-400"
                    aria-hidden="true"
                  >
                    description
                  </span>
                  <span className="truncate">
                    {files.length === 1
                      ? files[0].name
                      : `${files.length} 件のCSVを選択中`}
                  </span>
                </span>
              )}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <label
              htmlFor="csv-textarea"
              className="block text-xs text-zinc-500 dark:text-zinc-400"
            >
              公式サイトからコピーしたCSVテキストを貼り付けてください
            </label>
            <textarea
              id="csv-textarea"
              rows={5}
              placeholder="バージョン,タイトル,アーティスト,BEGINNER スコア,..."
              className="w-full rounded-sm border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
            />
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={
              busy || (mode === "file" ? !files.length : !csvText.trim())
            }
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm bg-zinc-700 px-4 py-2 text-xs font-bold text-white transition-colors enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm dark:bg-zinc-100 dark:text-zinc-900 dark:enabled:hover:bg-white"
          >
            <span
              className="material-symbols-outlined text-lg!"
              aria-hidden="true"
            >
              add_circle
            </span>
            プレーデータを保存
          </button>
        </div>
      </div>
    </section>
  );
}
