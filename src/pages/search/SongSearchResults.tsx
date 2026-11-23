import {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import type { DifficultyKey } from "../../../data/versions/constants";
import type { PlayStyle } from "../../settings/playStyle";
import { SearchResults } from "./SearchResults";
import {
  filterSongs,
  type SearchTarget,
  type SongFilters,
} from "./songFilters";
import { useSongCatalog } from "./useSongCatalog";
import type { CatalogSong } from "./songCatalog";

const SongDetailModal = lazy(
  () => import("../../components/song-detail/SongDetailModal"),
);

type SongSearchResultsProps = {
  playStyle: PlayStyle;
  filters: SongFilters;
  target: SearchTarget;
  keyword: string;
};

export default function SongSearchResults({
  playStyle,
  filters,
  target,
  keyword,
}: SongSearchResultsProps) {
  const { songs, failed, loading } = useSongCatalog(playStyle);
  const [selection, setSelection] = useState<{
    song: CatalogSong;
    playStyle: PlayStyle;
    difficulty?: DifficultyKey;
  }>();
  const openSong = useCallback(
    (song: CatalogSong, difficulty?: DifficultyKey) => {
      setSelection({ song, playStyle, difficulty });
    },
    [playStyle],
  );
  const closeSong = useCallback(() => setSelection(undefined), []);
  const criteria = useMemo(
    () => ({ filters, target, keyword }),
    [filters, target, keyword],
  );
  const deferredCriteria = useDeferredValue(criteria);
  const results = useMemo(
    () =>
      filterSongs(
        songs,
        deferredCriteria.filters,
        deferredCriteria.target,
        deferredCriteria.keyword,
      ),
    [songs, deferredCriteria],
  );

  return (
    <>
      {failed && (
        <p
          role="status"
          className="mb-4 text-sm text-zinc-600 dark:text-zinc-300"
        >
          プレーデータを読み込めなかったため、楽曲マスターを表示しています。
        </p>
      )}
      <SearchResults
        songs={results}
        total={songs.length}
        loading={loading}
        onOpenSong={openSong}
      />
      {selection && (
        <Suspense fallback={null}>
          <SongDetailModal
            song={selection.song}
            playStyle={selection.playStyle}
            initialDifficulty={selection.difficulty}
            onClose={closeSong}
          />
        </Suspense>
      )}
    </>
  );
}
