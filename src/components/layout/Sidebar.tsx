import { useId } from "react";
import { navigation, type PagePath } from "../../navigation";
import { snapshotLimit } from "../../pages/data/snapshotStore";
import { playStyles } from "../../settings/playStyle";
import { BrandMark } from "./BrandMark";
import { GitHubIcon } from "./GitHubIcon";
import { ThemeToggle } from "./ThemeToggle";
import type { SnapshotSummary } from "./useSnapshotSummary";

const siteUpdatedOn = "2026-11-23";
const repositoryUrl = "https://github.com/nanao0x0/infinitas-records";
const contactLinkClass = "font-semibold text-sky-700 underline underline-offset-2 dark:text-sky-300";

const footerButtonClass =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/70 dark:hover:text-zinc-100";

const navigationItemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors";

type SidebarProps = {
  snapshotSummary: SnapshotSummary | null;
  currentPath: PagePath;
  isDark: boolean;
  onToggleTheme: () => void;
  onClose?: () => void;
};

export function Sidebar({ currentPath, isDark, onToggleTheme, onClose, snapshotSummary }: SidebarProps) {
  const siteInfoId = useId();

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-1 flex items-center justify-between gap-3 px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <BrandMark size={32} />
          <span className="font-logo text-2xl leading-none tracking-wider text-zinc-800 dark:text-zinc-100">
            INFINITAS
            <br />
            Records
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={onClose}
          >
            <span
              className="material-symbols-outlined text-xl!"
              aria-hidden="true"
            >
              close
            </span>
          </button>
        )}
      </div>

      <nav aria-label="メインナビゲーション" className="px-3">
        <ul className="space-y-1">
          {navigation.map(({ icon, path, title }) => {
            const current = path === currentPath;
            const stateClass = current
              ? "bg-zinc-100 font-bold text-zinc-900 shadow-xs dark:bg-zinc-700/70 dark:text-white"
              : "font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/40 dark:hover:text-zinc-100";

            return (
              <li key={path}>
                <a
                  href={current ? "#main-content" : path}
                  aria-current={current ? "page" : undefined}
                  className={`${navigationItemClass} ${stateClass}`}
                  onClick={onClose}
                >
                  <span className="material-symbols-outlined text-[21px]!" aria-hidden="true">
                    {icon}
                  </span>
                  <span>{title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-3 p-4 pt-3">
        <div className="flex items-center gap-1 px-1">
          <ThemeToggle
            isDark={isDark}
            onToggle={onToggleTheme}
            className={footerButtonClass}
          />
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub（新しいタブで開く）"
            title="GitHub"
            className={footerButtonClass}
            onClick={onClose}
          >
            <GitHubIcon />
          </a>
          <button
            type="button"
            aria-label="サイトについて"
            title="サイトについて"
            popoverTarget={siteInfoId}
            className={footerButtonClass}
          >
            <span className="material-symbols-outlined text-xl!" aria-hidden="true">
              description
            </span>
          </button>
          <div
            id={siteInfoId}
            popover="auto"
            className="fixed inset-auto bottom-32 left-4 m-0 mb-2 w-52 max-w-[calc(100dvw-2rem)] rounded-md border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-700 shadow-lg [position-anchor:auto] supports-[bottom:anchor(top)]:[bottom:anchor(top,8rem)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <p>
              このサイトは個人が運営する非公式サイトです。情報は最新でない場合があるため正確な情報はゲーム内をご確認ください。情報の修正やバグ報告は
              <a href={repositoryUrl} target="_blank" rel="noopener noreferrer" className={contactLinkClass}>GitHub</a>
              または
              <a href="https://x.com/nanao_origin" target="_blank" rel="noopener noreferrer" className={contactLinkClass}>X</a>
              までお願いします。
            </p>
          </div>
        </div>

        <dl className="space-y-1 rounded-xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-2.5 text-[11px] text-zinc-600 dark:border-zinc-700/70 dark:bg-zinc-900/70 dark:text-zinc-300">
          {playStyles.map((mode) => (
            <div key={mode} className="flex items-center justify-between">
              <dt className="text-zinc-400 dark:text-zinc-500">{mode}</dt>
              <dd className="font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
                {snapshotSummary ? `${snapshotSummary.counts[mode]} / ${snapshotLimit}` : "—"}
              </dd>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-zinc-200/70 pt-1 text-[10px] text-zinc-400 dark:border-zinc-700/60 dark:text-zinc-500">
            <dt>最終更新</dt>
            <dd className="tabular-nums">
              <time dateTime={siteUpdatedOn}>{siteUpdatedOn.replaceAll("-", "/")}</time>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
