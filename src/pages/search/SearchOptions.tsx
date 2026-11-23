import { useEffect, useState } from "react";
import { DIFFICULTY_KEYS, LEVELS } from "../../../data/versions/constants";
import { difficulties, lamps } from "./searchPresentation";
import {
  chartFlags,
  defaultFilters,
  type FlagValue,
  type Range,
  type SongFilters,
} from "./songFilters";

const labelClass = "text-xs font-bold text-zinc-600 dark:text-zinc-300";
const numberClass =
  "min-w-0 w-full rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm tabular-nums text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const groupButtonClass =
  "cursor-pointer rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600";
const chipActive =
  "border-zinc-600 bg-zinc-600 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900";
const chipIdle =
  "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/60";
const flagOptions = [
  { value: "any", label: "未指定" },
  { value: "yes", label: "有り" },
  { value: "no", label: "無し" },
] as const;

type Chip = { value: string; label: string; dot?: string };
type ChipGroupProps = {
  title: string;
  chips: Chip[];
  selected: string[];
  onChange: (selected: string[]) => void;
  levels?: boolean;
};

function ChipGroup({
  title,
  chips,
  selected,
  onChange,
  levels = false,
}: ChipGroupProps) {
  return (
    <div role="group" aria-label={title}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className={labelClass}>{title}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={groupButtonClass}
            onClick={() => onChange(chips.map(({ value }) => value))}
          >
            全選択
          </button>
          <button
            type="button"
            className={groupButtonClass}
            onClick={() => onChange([])}
          >
            全解除
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map(({ value, label, dot }) => {
          const active = selected.includes(value);
          const sizeClass = levels
            ? "w-9 font-bold tabular-nums"
            : dot
              ? "inline-flex items-center gap-1.5 px-2.5 font-bold"
              : "px-2.5 font-medium";
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              className={`cursor-pointer rounded-sm border py-1 text-xs transition-colors ${sizeClass} ${active ? chipActive : chipIdle}`}
              onClick={() =>
                onChange(
                  active
                    ? selected.filter((item) => item !== value)
                    : [...selected, value],
                )
              }
            >
              {dot && (
                <span className={`size-2 shrink-0 rounded-full ${dot}`} />
              )}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChartFlag({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FlagValue;
  onChange: (value: FlagValue) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
      <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex shrink-0 rounded-sm bg-zinc-200/70 p-0.5 dark:bg-zinc-800"
      >
        {flagOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer rounded-sm px-2 py-0.5 text-xs font-bold transition-colors ${
              value === option.value
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberRange({
  title,
  max,
  range,
  onChange,
}: {
  title: string;
  max: number;
  range: Range;
  onChange: (range: Range) => void;
}) {
  return (
    <div role="group" aria-label={title}>
      <div className={`mb-2 ${labelClass}`}>{title}</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={max}
          value={range.min}
          onChange={(event) => onChange({ ...range, min: event.target.value })}
          placeholder="最小"
          aria-label={`${title}の最小値`}
          className={numberClass}
        />
        <span className="text-sm text-zinc-400">〜</span>
        <input
          type="number"
          min={0}
          max={max}
          value={range.max}
          onChange={(event) => onChange({ ...range, max: event.target.value })}
          placeholder="最大"
          aria-label={`${title}の最大値`}
          className={numberClass}
        />
      </div>
    </div>
  );
}

const difficultyChips = difficulties.map(({ name, dot }, index) => ({
  label: name,
  dot,
  value: DIFFICULTY_KEYS[index],
}));
const levelChips = LEVELS.map((level) => ({
  label: String(level),
  value: String(level),
}));
const lampChips = Object.entries(lamps).map(([value, { label, dot }]) => ({
  label,
  dot,
  value,
}));

export function SearchOptions({
  filters,
  onChange,
}: {
  filters: SongFilters;
  onChange: (filters: SongFilters) => void;
}) {
  const [versionChoices, setVersionChoices] = useState<Chip[]>();
  useEffect(() => {
    let active = true;
    void import("./masterVersions").then(
      ({ versionChoices }) => {
        if (active) setVersionChoices(versionChoices);
      },
      () => {
        if (active) setVersionChoices([]);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  const activeCount =
    [
      filters.versions,
      filters.difficulties,
      filters.levels,
      filters.lamps,
    ].filter((values) => values.length).length +
    Object.values(filters.flags).filter((value) => value !== "any").length +
    Number(Boolean(filters.bpm.min || filters.bpm.max)) +
    Number(Boolean(filters.bp.min || filters.bp.max));
  return (
    <div className="relative mb-6 sm:mb-8">
      <details className="group rounded-md border border-zinc-200 bg-white px-3 py-2 transition-colors dark:border-zinc-700 dark:bg-zinc-800">
        <summary className="flex h-8 cursor-pointer list-none items-center pr-11 text-zinc-800 dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2 text-sm font-bold sm:text-base">
            <span
              className="material-symbols-outlined -rotate-90 group-open:rotate-0"
              aria-hidden="true"
            >
              keyboard_arrow_down
            </span>
            検索オプション
            {activeCount > 0 && (
              <span className="rounded-full bg-zinc-600 px-2 py-0.5 text-xs leading-none font-bold text-white tabular-nums dark:bg-zinc-100 dark:text-zinc-900">
                {activeCount}
              </span>
            )}
          </span>
        </summary>
        <div className="pt-3">
          <div className="space-y-5 border-t border-dashed border-zinc-200 px-1 pt-4 pb-2 dark:border-zinc-700">
            {versionChoices ? (
              <ChipGroup
                title="収録バージョン"
                chips={versionChoices}
                selected={filters.versions}
                onChange={(versions) => onChange({ ...filters, versions })}
              />
            ) : (
              <div aria-hidden="true">
                <div className={`mb-2 ${labelClass}`}>収録バージョン</div>
                <div className="flex flex-wrap gap-1.5 motion-safe:animate-pulse">
                  {Array.from({ length: 24 }, (_, index) => (
                    <span
                      key={index}
                      className="h-[26px] w-16 rounded-sm bg-zinc-100 dark:bg-zinc-700"
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-5 md:grid-cols-2">
              <ChipGroup
                title="難易度"
                chips={difficultyChips}
                selected={filters.difficulties}
                onChange={(difficulties) =>
                  onChange({ ...filters, difficulties })
                }
              />
              <ChipGroup
                title="レベル"
                chips={levelChips}
                selected={filters.levels}
                onChange={(levels) => onChange({ ...filters, levels })}
                levels
              />
            </div>
            <div className="grid items-start gap-5 lg:grid-cols-[1fr_280px]">
              <div>
                <div className={`mb-2 ${labelClass}`}>譜面オプション</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {chartFlags.map((flag) => (
                    <ChartFlag
                      key={flag}
                      label={flag}
                      value={filters.flags[flag] ?? "any"}
                      onChange={(value) =>
                        onChange({
                          ...filters,
                          flags: { ...filters.flags, [flag]: value },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
              <NumberRange
                title="BPM範囲"
                max={999}
                range={filters.bpm}
                onChange={(bpm) => onChange({ ...filters, bpm })}
              />
            </div>
            <div className="grid items-start gap-5 border-t border-dashed border-zinc-200 pt-4 lg:grid-cols-[1fr_280px] dark:border-zinc-700">
              <ChipGroup
                title="クリアランプ"
                chips={lampChips}
                selected={filters.lamps}
                onChange={(lamps) => onChange({ ...filters, lamps })}
              />
              <NumberRange
                title="BP範囲（ミスカウント）"
                max={9999}
                range={filters.bp}
                onChange={(bp) => onChange({ ...filters, bp })}
              />
            </div>
          </div>
        </div>
      </details>
      <div className="absolute top-[9px] right-[13px] border-l border-zinc-200 pl-2 dark:border-zinc-700">
        <button
          type="button"
          title="すべての検索オプションをリセット"
          aria-label="すべての検索オプションをリセット"
          className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
          onClick={() => onChange(defaultFilters)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            reset_settings
          </span>
        </button>
      </div>
    </div>
  );
}
