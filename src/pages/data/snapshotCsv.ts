import { gzipSync } from "fflate";
import type { PlayStyle } from "../../settings/playStyle";
import { decodeCsv, parseCsvCount, parseCsvLamp, readCsvTable } from "./playCsv";
import type { StoredSnapshot } from "./snapshotStore";
import {
  formatSnapshotTimestamp,
  snapshotFileTimestamp,
} from "./snapshotTimestamp";

export type CsvInput = { files: File[] } | { text: string };

export function validateCsv(text: string, playStyle?: PlayStyle) {
  const { rows, errors, headerLength, duplicateColumns, chartColumns, titleColumn, versionColumn, artistColumn } = readCsvTable(text);
  if (errors.length || !rows.length) {
    throw new Error("CSVの形式が正しくないか、楽曲データがありません。");
  }

  const scoringColumns = chartColumns.filter(({ difficulty, present }) => difficulty !== "beginner" || present);
  if (
    duplicateColumns ||
    [titleColumn, versionColumn, artistColumn].some((index) => index < 0) ||
    scoringColumns.some(({ complete }) => !complete)
  ) {
    throw new Error("INFINITAS公式CSVに必要な列が見つかりません。");
  }
  if (playStyle === "DP" && scoringColumns.some(({ difficulty }) => difficulty === "beginner")) {
    throw new Error("SP のCSVです。プレースタイルを SP に切り替えてください。");
  }
  for (const [index, row] of rows.entries()) {
    const valid =
      row.length >= headerLength &&
      row.slice(headerLength).every((value) => !value.trim()) &&
      row[titleColumn]?.trim() &&
      row[versionColumn]?.trim() &&
      scoringColumns.every(
        ({ score, misses, lamp, plays }) =>
          [score, misses, plays].every((column) =>
            row[column].trim() === "---" || parseCsvCount(row[column]) !== null,
          ) && parseCsvLamp(row[lamp]) !== null,
      );
    if (!valid)
      throw new Error(
        `CSVのデータ行 ${index + 1} に不足または不正な値があります。`,
      );
  }
  return rows.length;
}

async function prepareSnapshot(
  input: File | string,
  playStyle: PlayStyle,
): Promise<StoredSnapshot> {
  const file = typeof input === "string" ? null : input;
  if (file && !/\.csv$/i.test(file.name))
    throw new Error("CSVファイルを選択してください。");
  const fileStyle = (file?.name.match(/_(sp|dp)_score(?:[ ._(]|$)/i) ??
    file?.name.match(/^infinitas_(sp|dp)_/i))?.[1].toUpperCase();
  if (fileStyle && fileStyle !== playStyle) {
    throw new Error(
      `${fileStyle} のCSVです。プレースタイルを ${fileStyle} に切り替えてください。`,
    );
  }

  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(await input.arrayBuffer());
  const songCount = validateCsv(decodeCsv(bytes), playStyle);
  const savedAt = file ? snapshotFileTimestamp(file) : Date.now();
  const name =
    file?.name ??
    `infinitas_${playStyle.toLowerCase()}_${formatSnapshotTimestamp(savedAt)}.csv`;
  return {
    id: crypto.randomUUID(),
    playStyle,
    savedAt,
    name,
    method: file ? "file" : "text",
    songCount,
    size: bytes.byteLength,
    gzip: gzipSync(bytes),
  };
}

export async function prepareSnapshots(input: CsvInput, playStyle: PlayStyle) {
  if ("text" in input) return [await prepareSnapshot(input.text, playStyle)];
  const snapshots: StoredSnapshot[] = [];
  for (const file of input.files) {
    try {
      snapshots.push(await prepareSnapshot(file, playStyle));
    } catch (error) {
      const message =
        error instanceof Error && !(error instanceof DOMException)
          ? error.message
          : "CSVを読み込めませんでした。";
      throw new Error(`${file.name}: ${message}`);
    }
  }
  return snapshots;
}
