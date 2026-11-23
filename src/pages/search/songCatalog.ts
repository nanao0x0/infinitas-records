import { csvSongCorrections } from "../../../data/csvSongCorrections";
import {
  DIFFICULTY_KEYS,
  type DifficultyKey,
} from "../../../data/versions/constants";
import type { Bpm } from "../../../types/versions";
import type { PlayStyle } from "../../settings/playStyle";
import { parseCsvCount, parseCsvLamp, readCsvTable } from "../data/playCsv";
import type { lamps } from "./searchPresentation";
import { masterVersions } from "./masterVersions";

type Lamp = keyof typeof lamps;
type PlayChart = {
  lamp: Lamp | null;
  played: boolean;
  misses: number | null;
  score: number | null;
  plays: number | null;
  lastPlayed: string | null;
  lastScoreUpdated: string | null;
};
type Chart = {
  level: number | null;
  lamp: Lamp | null;
  misses: number | null;
  options: number | null;
  score: number | null;
  plays: number | null;
  lastPlayed: string | null;
  lastScoreUpdated: string | null;
  bpmRange?: Bpm;
  bpm?: string;
};

export type CatalogSong = {
  id: string;
  version: string;
  versionIds: string[];
  title: string;
  artist: string;
  genre: string;
  bpm: string;
  bpmRange?: Bpm;
  charts: (Chart | null)[];
  csvIdentity?: { artist: string; version: string };
};

type PlayRecord = {
  rowNumber: number;
  title: string;
  artist: string;
  version: string;
  correctedVersionId?: string;
  charts: Partial<Record<DifficultyKey, PlayChart>>;
};

export type PlayRecords = Map<string, PlayRecord[]>;

function normalize(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function songKey(title: string, artist: string) {
  // Official CSVs and the master can space initials differently (D.J. Spugna / D.J.Spugna).
  const artistKey = normalize(artist).replace(/(?<=[a-z]\.)\s+(?=[a-z])/g, "");
  return JSON.stringify([normalize(title), artistKey]);
}

function typographyKey(key: string) {
  // Straight quotes are escaped in the serialized song key.
  return key.replace(/\s/g, "").replace(/[“”]/g, '\\"');
}

function getVersionAliases(version: (typeof masterVersions)[number]) {
  const aliases = [
    version.name,
    version.shorthand,
    version.name.replace(/^beatmania IIDX(?: \d+\b)?\s*/i, ""),
  ]
    .map(normalize)
    .filter(Boolean);
  if (version.id === "iidx1" || version.id === "substream")
    aliases.push("1st&substream");
  return aliases;
}

const versionAliases = new Map(
  masterVersions.map((version) => [version.id, getVersionAliases(version)]),
);
const masterVersionsByKey = new Map<string, string[]>();
const masterVersionsBySpacing = new Map<string, string[]>();
const keyedMasterVersions = masterVersions.map((version) => ({
  ...version,
  songs: version.songs.map((song) => ({ song, key: songKey(song.title, song.artist) })),
}));
for (const { id, songs } of keyedMasterVersions) {
  for (const { key } of songs) {
    const matches = masterVersionsByKey.get(key);
    if (matches) matches.push(id);
    else masterVersionsByKey.set(key, [id]);
    const looseKey = typographyKey(key);
    const looseMatches = masterVersionsBySpacing.get(looseKey);
    if (looseMatches) looseMatches.push(id);
    else masterVersionsBySpacing.set(looseKey, [id]);
  }
}

function csvRowKey(version: string, title: string, artist: string) {
  return JSON.stringify([version, title, artist]);
}

const corrections = new Map<string, { key: string; versionId: string }>();
const correctedTitles = new Set<string>();
for (const { csv, master } of csvSongCorrections) {
  const key = songKey(master.title, master.artist);
  const targets = masterVersionsByKey
    .get(key)
    ?.filter((id) => id === master.versionId);
  if (targets?.length === 1) {
    correctedTitles.add(csv.title);
    corrections.set(csvRowKey(csv.version, csv.title, csv.artist), {
      key,
      versionId: master.versionId,
    });
  }
}

function parseRecordDate(value?: string) {
  const text = value?.trim();
  return text && /^\d{4}[/-]\d{2}[/-]\d{2} \d{2}:\d{2}(:\d{2})?$/.test(text)
    ? text
    : null;
}

export function readPlayRecords(
  csv: string,
  onlySong?: CatalogSong,
): PlayRecords {
  const { rows, errors, chartColumns, titleColumn, artistColumn, versionColumn } = readCsvTable(csv);
  if (
    errors.length ||
    titleColumn < 0 ||
    artistColumn < 0 ||
    versionColumn < 0
  ) {
    throw new Error("プレーデータの楽曲情報を読み取れませんでした。");
  }

  const records: PlayRecords = new Map();
  const targetKey =
    onlySong &&
    typographyKey(
      songKey(onlySong.title, onlySong.csvIdentity?.artist ?? onlySong.artist),
    );
  const compactTitle = (title: string) => normalize(title).replace(/\s/g, "").replace(/[“”]/g, '"');
  const targetTitle = onlySong && compactTitle(onlySong.title);
  for (const [rowNumber, row] of rows.entries()) {
    const title = row[titleColumn];
    const artist = row[artistColumn];
    const version = row[versionColumn];
    if (!title || artist === undefined || !version) continue;
    if (targetTitle !== undefined && !correctedTitles.has(title) && compactTitle(title) !== targetTitle) continue;
    const correction = corrections.get(csvRowKey(version, title, artist));
    const key = correction?.key ?? songKey(title, artist);
    if (targetKey && typographyKey(key) !== targetKey) continue;
    const record: PlayRecord = {
      rowNumber,
      title,
      artist,
      version,
      correctedVersionId: correction?.versionId,
      charts: {},
    };
    for (const columns of chartColumns) {
      const rawLamp = row[columns.lamp]?.trim();
      if (!rawLamp) continue;
      const lamp = parseCsvLamp(rawLamp);
      const lastPlayed = parseRecordDate(row[columns.lastPlayed]);
      const score = parseCsvCount(row[columns.score]);
      const plays = parseCsvCount(row[columns.plays]);
      const played =
        (lamp !== null && lamp !== "NO_PLAY") ||
        (score ?? 0) > 0 ||
        (plays ?? 0) > 0 ||
        lastPlayed !== null;
      const misses = parseCsvCount(row[columns.misses]);
      record.charts[columns.difficulty] = {
        lamp,
        played,
        misses,
        score: played ? score : null,
        plays,
        lastPlayed,
        lastScoreUpdated: parseRecordDate(row[columns.lastScoreUpdated]),
      };
    }
    const matches = records.get(key);
    if (matches) matches.push(record);
    else records.set(key, [record]);
  }
  return records;
}

function matchMasterRecord(
  key: string,
  versionId: string,
  candidates: PlayRecord[],
) {
  const corrected = candidates.filter(
    (record) => record.correctedVersionId === versionId,
  );
  if (corrected.length)
    return corrected.length === 1 ? corrected[0] : undefined;

  const uncorrected = candidates.filter(
    (record) => record.correctedVersionId === undefined,
  );
  const masterVersions = masterVersionsByKey.get(key) ?? [];
  if (uncorrected.length === 1 && masterVersions.length === 1)
    return uncorrected[0];
  const inVersion = uncorrected.filter((record) => {
    const name = normalize(record.version);
    const matchingVersions = masterVersions.filter((id) =>
      versionAliases.get(id)?.includes(name),
    );
    return matchingVersions.length === 1 && matchingVersions[0] === versionId;
  });
  return inVersion.length === 1 ? inVersion[0] : undefined;
}

function createRecordMatcher(records: PlayRecords) {
  const recordsBySpacing = new Map<string, PlayRecord[]>();
  for (const [key, candidates] of records) {
    const looseKey = typographyKey(key);
    const matches = recordsBySpacing.get(looseKey);
    if (matches) matches.push(...candidates);
    else recordsBySpacing.set(looseKey, [...candidates]);
  }

  return (key: string, versionId: string) => {
    const exact = matchMasterRecord(key, versionId, records.get(key) ?? []);
    if (exact) return exact;

    const looseKey = typographyKey(key);
    const candidates = recordsBySpacing
      .get(looseKey)
      ?.filter((record) =>
        record.correctedVersionId === undefined
          ? versionAliases.get(versionId)?.includes(normalize(record.version))
          : record.correctedVersionId === versionId,
      );
    if (
      candidates?.length !== 1 ||
      candidates[0].correctedVersionId !== undefined
    )
      return undefined;

    const [candidate] = candidates;
    const csvVersion = normalize(candidate.version);
    const possibleVersions = masterVersionsBySpacing
      .get(looseKey)
      ?.filter((id) => versionAliases.get(id)?.includes(csvVersion));
    if (possibleVersions?.length !== 1 || possibleVersions[0] !== versionId)
      return undefined;

    const originalKey = songKey(candidate.title, candidate.artist);
    const originalRecords = records.get(originalKey) ?? [];
    // Do not reuse a CSV row that the normal matcher already assigns to another song.
    if (
      masterVersionsByKey
        .get(originalKey)
        ?.some(
          (id) =>
            matchMasterRecord(originalKey, id, originalRecords) === candidate,
        )
    )
      return undefined;

    return candidate;
  };
}

export function findSongPlayRecord(song: CatalogSong, records: PlayRecords) {
  const key = songKey(song.title, song.csvIdentity?.artist ?? song.artist);
  const candidates = records.get(key) ?? [];
  if (!song.csvIdentity)
    return createRecordMatcher(records)(key, song.versionIds[0]);
  const version = normalize(song.csvIdentity.version);
  const matches = candidates.filter(
    (record) => normalize(record.version) === version,
  );
  return matches.length === 1 ? matches[0] : undefined;
}

function formatBpm({ min, max }: Bpm) {
  return max == null || min === max ? String(min) : `${min}-${max}`;
}

export function buildSongCatalog(
  playStyle: PlayStyle,
  records: PlayRecords,
): CatalogSong[] {
  const style = playStyle === "SP" ? "sp" : "dp";
  const matchRecord = createRecordMatcher(records);
  const matched = new Set<PlayRecord>();
  const catalog: CatalogSong[] = keyedMasterVersions.flatMap((version) =>
    version.songs.flatMap(({ song, key }, index) => {
      const playRecord = matchRecord(key, version.id);
      if (playRecord) matched.add(playRecord);
      const charts = DIFFICULTY_KEYS.map((difficulty): Chart | null => {
        const chart = song.difficulty[style][difficulty];
        const playedChart = playRecord?.charts[difficulty];
        if (chart?.level == null && !playedChart?.played) return null;
        return {
          level: chart?.level ?? null,
          lamp: playedChart ? playedChart.lamp : "NO_PLAY",
          misses: playedChart?.misses ?? null,
          score: playedChart?.score ?? null,
          plays: playedChart?.plays ?? null,
          lastPlayed: playedChart?.lastPlayed ?? null,
          lastScoreUpdated: playedChart?.lastScoreUpdated ?? null,
          options: chart?.level == null ? null : chart.options,
          bpmRange: chart?.bpm,
          bpm: chart?.bpm ? formatBpm(chart.bpm) : undefined,
        };
      });
      if (!charts.some(Boolean)) return [];
      return [
        {
          id: `${version.id}:${index}`,
          version: version.name,
          versionIds: [version.id],
          title: song.title,
          artist: song.artist,
          genre: song.genre,
          bpm: formatBpm(song.bpm),
          bpmRange: song.bpm,
          charts,
        },
      ];
    }),
  );

  for (const candidates of records.values()) {
    for (const record of candidates) {
      if (matched.has(record)) continue;
      const versions = masterVersions.filter(({ id }) =>
        versionAliases.get(id)?.includes(normalize(record.version)),
      );
      catalog.push({
        id: `csv:${record.rowNumber}`,
        version: versions.length === 1 ? versions[0].name : record.version,
        versionIds: versions.map(({ id }) => id),
        title: record.title,
        artist: record.artist || "不明",
        genre: "不明",
        bpm: "不明",
        csvIdentity: { artist: record.artist, version: record.version },
        charts: DIFFICULTY_KEYS.map((difficulty) => {
          const chart = record.charts[difficulty];
          return chart?.played
            ? {
                level: null,
                lamp: chart.lamp,
                misses: chart.misses,
                score: chart.score,
                plays: chart.plays,
                lastPlayed: chart.lastPlayed,
                lastScoreUpdated: chart.lastScoreUpdated,
                options: null,
              }
            : null;
        }),
      });
    }
  }
  return catalog;
}
