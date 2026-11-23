import { useEffect, useState } from "react";
import { lampOrder, levels, type Lamp } from "./dashboardData";
import { difficulties } from "../search/searchPresentation";

export const comparisonTabs = [
  { key: "all", label: "すべて" },
  { key: "lamp", label: "ランプ更新" },
  { key: "bp", label: "BP減少" },
  { key: "score", label: "スコア更新" },
] as const;

export const candidateTargets = [
  { value: "HARD", label: "HARD狙い（未HARD）" },
  { value: "EX_HARD", label: "EX HARD狙い（未EXH）" },
  { value: "FC", label: "FC狙い（未FC）" },
  { value: "CLEAR", label: "CLEAR狙い（未CLEAR）" },
] as const;

export const candidateSortOptions = [
  { value: "bp", label: "BPが少ない順" },
  { value: "score", label: "スコアが高い順" },
  { value: "plays", label: "プレー回数が多い順" },
] as const;
export const defaultCandidateBp = "20";

export const difficultyOptions = [
  { value: "ALL", label: "全難易度" },
  ...difficulties.map(({ name }) => ({ value: name, label: name })),
];
export type ComparisonTab = (typeof comparisonTabs)[number]["key"];

export type DashboardPreferences = {
  comparisonTab: ComparisonTab;
  shareFocus: ComparisonTab;
  excludeFailed: boolean;
  trendLevel: string;
  versionLevel: string;
  candidateLevel: string;
  targetLamp: (typeof candidateTargets)[number]["value"];
  maxBp: string;
  candidateQuery: string;
  candidateSort: (typeof candidateSortOptions)[number]["value"];
  rankingQuery: string;
  rankingLevel: string;
  staleLevel: string;
  staleDifficulty: string;
  stagnationLevel: string;
  hiddenTrendLamps: Lamp[];
  hiddenLevelLamps: Lamp[];
};

export type UpdateDashboardPreference = <K extends keyof DashboardPreferences>(
  name: K,
  value: DashboardPreferences[K],
) => void;

const storageKey = "infinitas-records.dashboardPreferences";
const defaults: DashboardPreferences = {
  comparisonTab: "all",
  shareFocus: "all",
  excludeFailed: false,
  trendLevel: "ALL",
  versionLevel: "ALL",
  candidateLevel: "12",
  targetLamp: "HARD",
  maxBp: defaultCandidateBp,
  candidateQuery: "",
  candidateSort: "bp",
  rankingQuery: "",
  rankingLevel: "ALL",
  staleLevel: "ALL",
  staleDifficulty: "ALL",
  stagnationLevel: "ALL",
  hiddenTrendLamps: [],
  hiddenLevelLamps: [],
};

function choose<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
): T {
  return options.find((option) => option === value) ?? fallback;
}

function readHiddenLamps(value: unknown) {
  return Array.isArray(value)
    ? lampOrder.filter((lamp) => value.includes(lamp))
    : [];
}

function readPreferences(): DashboardPreferences {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "{}",
    ) as Partial<DashboardPreferences> | null;
    const levelValues = levels.map(({ value }) => value);
    const comparisonValues = comparisonTabs.map(({ key }) => key);
    return {
      comparisonTab: choose(
        saved?.comparisonTab,
        comparisonValues,
        defaults.comparisonTab,
      ),
      shareFocus: choose(
        saved?.shareFocus,
        comparisonValues,
        defaults.shareFocus,
      ),
      excludeFailed: saved?.excludeFailed === true,
      trendLevel: choose(saved?.trendLevel, levelValues, defaults.trendLevel),
      versionLevel: choose(
        saved?.versionLevel,
        levelValues,
        defaults.versionLevel,
      ),
      candidateLevel: choose(
        saved?.candidateLevel,
        levelValues,
        defaults.candidateLevel,
      ),
      targetLamp: choose(
        saved?.targetLamp,
        candidateTargets.map(({ value }) => value),
        defaults.targetLamp,
      ),
      maxBp:
        typeof saved?.maxBp === "string" && /^\d*$/.test(saved.maxBp)
          ? saved.maxBp
          : defaults.maxBp,
      candidateQuery:
        typeof saved?.candidateQuery === "string"
          ? saved.candidateQuery
          : defaults.candidateQuery,
      candidateSort: choose(
        saved?.candidateSort,
        candidateSortOptions.map(({ value }) => value),
        defaults.candidateSort,
      ),
      rankingQuery:
        typeof saved?.rankingQuery === "string"
          ? saved.rankingQuery
          : defaults.rankingQuery,
      rankingLevel: choose(
        saved?.rankingLevel,
        levelValues,
        defaults.rankingLevel,
      ),
      staleLevel: choose(saved?.staleLevel, levelValues, defaults.staleLevel),
      staleDifficulty: choose(
        saved?.staleDifficulty,
        difficultyOptions.map(({ value }) => value),
        defaults.staleDifficulty,
      ),
      stagnationLevel: choose(
        saved?.stagnationLevel,
        levelValues,
        defaults.stagnationLevel,
      ),
      hiddenTrendLamps: readHiddenLamps(saved?.hiddenTrendLamps),
      hiddenLevelLamps: readHiddenLamps(saved?.hiddenLevelLamps),
    };
  } catch {
    return defaults;
  }
}

export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState(readPreferences);
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      // Keep the current settings when storage is unavailable.
    }
  }, [preferences]);

  const updatePreference: UpdateDashboardPreference = (name, value) => {
    setPreferences((current) => ({ ...current, [name]: value }));
  };

  return { preferences, updatePreference };
}
