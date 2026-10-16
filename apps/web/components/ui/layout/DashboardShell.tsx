"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { copy } from "@/copy";
import type { RegisteredUser } from "@/lib/api/auth";
import {
  BellIcon,
  MenuIcon,
  SearchIcon,
  TerminalIcon,
} from "@/components/icons";
import AvatarMenu from "@/components/ui/navigation/AvatarMenu";
import { secondaryNav, workspaceNav, type NavItem } from "@/components/ui/navigation/navItems";

export interface DashboardShellProps {
  user: RegisteredUser;
  children: ReactNode;
  active?: string;
}

/**
 * The single application frame (folio chrome from the validated Stitch
 * mockups: 240px paper sidebar, 56px topbar with the search pinned to
 * the content edge, full-width footer). Every workspace page renders
 * inside it and marks its nav entry through `active`.
 * Client boundary is the mobile sidebar toggle only.
 */
export default function DashboardShell({ user, children, active = "dashboard" }: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="folio-shell">
      <aside className="folio-sidebar">
        <FolioSidebar active={active} />
      </aside>

      {menuOpen ? (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-ink/30"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="folio-sidebar-mobile">
            <FolioSidebar active={active} />
          </aside>
        </div>
      ) : null}

      <div className="dash-main-col">
        <header className="folio-topbar">
          <div className="folio-topbar-lead">
            <span className="md:hidden">
              <button
                type="button"
                className="folio-icon-btn"
                aria-label={copy.dashboard.menuButtonLabel}
                onClick={() => setMenuOpen(true)}
              >
                <MenuIcon />
              </button>
            </span>

            <div role="search" className="folio-search">
              <span className="folio-search-icon">
                <SearchIcon size={16} />
              </span>
              <label htmlFor="folio-search" className="sr-only">
                {copy.dashboard.searchLabel}
              </label>
              <input
                id="folio-search"
                type="search"
                autoComplete="off"
                placeholder={copy.dashboard.searchPlaceholder}
                className="folio-search-input"
              />
              <span className="folio-search-kbd">
                <kbd className="folio-kbd" aria-hidden="true">
                  {copy.dashboard.searchShortcut}
                </kbd>
              </span>
            </div>
          </div>

          <div className="folio-actions">
            <button
              type="button"
              className="folio-icon-btn"
              aria-label={copy.dashboard.notificationsLabel}
              disabled
            >
              <BellIcon />
            </button>
            <button
              type="button"
              className="folio-icon-btn"
              aria-label={copy.dashboard.terminalLabel}
              disabled
            >
              <TerminalIcon />
            </button>
            <span className="folio-actions-rule" aria-hidden="true" />
            <AvatarMenu user={user} variant="folio" />
          </div>
        </header>

        <main className="folio-content">
          <div className="folio-content-inner">{children}</div>
        </main>

        <footer className="folio-footer">
          <div className="folio-footer-inner">
            <p>{copy.dashboard.footer}</p>
            <div className="folio-footer-links">
              <Link href="/" className="folio-footer-link">
                {copy.dashboard.footerPrivacy}
              </Link>
              <Link href="/" className="folio-footer-link">
                {copy.dashboard.footerDocs}
              </Link>
              <Link href="/" className="folio-footer-link">
                {copy.dashboard.footerStatus}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Sidebar body shared by the docked and mobile-drawer instances. */
function FolioSidebar({ active }: { active: string }) {
  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const current = active === item.key;

    if (!item.href) {
      return (
        <button
          key={item.key}
          type="button"
          disabled
          className="folio-nav-link opacity-60 cursor-not-allowed"
          aria-disabled="true"
        >
          <Icon className="folio-nav-icon" />
          <span>{item.label}</span>
          <span className="folio-nav-soon">{copy.dashboard.soonBadge}</span>
        </button>
      );
    }

    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={current ? "page" : undefined}
        className={`folio-nav-link ${current ? "folio-nav-link-active" : ""}`}
      >
        <Icon className="folio-nav-icon" />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <nav className="flex flex-col justify-between h-full" aria-label={copy.dashboard.navSection}>
      <div>
        <div className="folio-brand">
          <span className="folio-brand-mark" aria-hidden="true">
            {copy.auth.brandInitial}
          </span>
          <span>
            <span className="folio-brand-name">{copy.auth.brandName}</span>
            <span className="folio-brand-core">{copy.dashboard.brandVersion}</span>
          </span>
        </div>

        <div className="folio-nav">{workspaceNav.map(renderItem)}</div>
      </div>

      <div className="folio-sidebar-foot">
        <div className="folio-nav">{secondaryNav.map(renderItem)}</div>
        <div className="folio-status-chip">
          <span className="folio-status-label">
            <span className="folio-status-dot" aria-hidden="true" />
            {copy.dashboard.envBadge}
          </span>
          <span className="folio-status-value">{copy.dashboard.envSynced}</span>
        </div>
      </div>
    </nav>
  );
}
