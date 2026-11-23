import type { ReactNode } from "react";
import { navigation, type PagePath } from "../../navigation";
import { playStyles, usePlayStyle } from "../../settings/playStyle";

const styleButtonClass =
  "cursor-pointer whitespace-nowrap rounded-sm px-4 py-2 text-xs leading-none font-bold transition-colors sm:text-sm";
const selectedClass =
  "bg-zinc-600 text-white dark:bg-zinc-100 dark:text-zinc-900";
const unselectedClass =
  "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700";

type PageHeaderProps = {
  path: PagePath;
  className?: string;
  children?: ReactNode;
};

export function PageHeader({
  path,
  className = "",
  children,
}: PageHeaderProps) {
  const { title, icon } = navigation.find((page) => page.path === path)!;
  const { playStyle, setPlayStyle } = usePlayStyle();

  return (
    <header
      className={`flex flex-wrap items-center justify-between gap-4 font-dashboard ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl leading-none font-bold text-zinc-800 sm:text-3xl dark:text-zinc-100">
          <span
            className="material-symbols-outlined text-[32px]! sm:text-[40px]!"
            aria-hidden="true"
          >
            {icon}
          </span>
          {title}
        </h1>
        {children}
      </div>

      <div
        role="group"
        aria-label="プレースタイル"
        className="flex w-fit rounded-sm border border-zinc-200 bg-white p-1 transition-colors dark:border-zinc-700 dark:bg-zinc-800"
      >
        {playStyles.map((style) => (
          <button
            key={style}
            type="button"
            aria-pressed={playStyle === style}
            className={`${styleButtonClass} ${playStyle === style ? selectedClass : unselectedClass}`}
            onClick={() => setPlayStyle(style)}
          >
            {style}
          </button>
        ))}
      </div>
    </header>
  );
}
