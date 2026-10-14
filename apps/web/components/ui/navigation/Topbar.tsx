import { copy } from "@/copy";
import type { RegisteredUser } from "@/lib/api/auth";
import { IconButton } from "@/components/ui";
import { BellIcon, MenuIcon, SearchIcon, TerminalIcon } from "@/components/icons";
import AvatarMenu from "./AvatarMenu";

export interface TopbarProps {
  user: RegisteredUser;
  onMenuClick: () => void;
}

/**
 * Dashboard topbar from the validated Stitch design: mobile menu
 * toggle, search with shortcut hint, notification and console actions,
 * and the avatar menu. Search and the two icon actions are visual only
 * until their backends ship — labelled, disabled, never faking a query.
 */
export default function Topbar({ user, onMenuClick }: TopbarProps) {
  return (
    <header className="dash-topbar">
      <span className="md:hidden">
        <IconButton aria-label={copy.dashboard.menuButtonLabel} onClick={onMenuClick}>
          <MenuIcon />
        </IconButton>
      </span>

      <div role="search" className="dash-search">
        <SearchIcon size={16} className="shrink-0 text-muted" />
        <label htmlFor="dashboard-search" className="sr-only">
          {copy.dashboard.searchLabel}
        </label>
        <input
          id="dashboard-search"
          type="search"
          autoComplete="off"
          placeholder={copy.dashboard.searchPlaceholder}
          className="dash-search-input"
        />
        <kbd className="dash-kbd" aria-hidden="true">
          {copy.dashboard.searchShortcut}
        </kbd>
      </div>

      <span className="flex-1" />

      <span className="hidden sm:flex items-center gap-1">
        <IconButton aria-label={copy.dashboard.notificationsLabel} disabled>
          <BellIcon />
        </IconButton>
        <IconButton aria-label={copy.dashboard.terminalLabel} disabled>
          <TerminalIcon />
        </IconButton>
      </span>

      <AvatarMenu user={user} />
    </header>
  );
}
