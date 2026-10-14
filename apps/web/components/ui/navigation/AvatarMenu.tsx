"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/copy";
import type { RegisteredUser } from "@/lib/api/auth";
import { logout } from "@/lib/api/auth";
import { ChevronDownIcon } from "@/components/icons";

/**
 * Avatar dropdown, open-modal state from the validated Stitch design.
 * Grouped sections mirror the design; every destination without a page
 * renders disabled with its version/shortcut badge instead of a dead
 * link. Only Sign out acts — it revokes server-side first.
 */
export default function AvatarMenu({ user }: { user: RegisteredUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function onPointer(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open ]);

  async function onSignOut() {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await logout();
    } finally {
      router.replace("/");
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="dash-avatar-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={copy.dashboard.avatarMenuLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dash-avatar-btn" aria-hidden="true">
          {user.display_name.slice(0, 1).toUpperCase()}
        </span>
        <span className="dash-avatar-name truncate">{user.display_name}</span>
        <ChevronDownIcon size={16} className="shrink-0 text-muted" />
      </button>

      {open ? (
        <div role="menu" aria-label={copy.dashboard.avatarMenuLabel} className="dash-menu">
          <div className="dash-menu-header">
            <p className="text-body font-bold text-ink truncate">{user.display_name}</p>
            <p className="text-caption text-muted truncate">{user.email}</p>
            <span className="dash-tenant-chip">{copy.dashboard.tenantBadge}</span>
          </div>

          <div className="dash-menu-section">
            <button type="button" role="menuitem" disabled className="dash-menu-item" aria-disabled="true">
              <span>{copy.dashboard.menuProofMatrix}</span>
              <span className="dash-menu-meta">{copy.dashboard.shortcutProfile}</span>
            </button>
            <button type="button" role="menuitem" disabled className="dash-menu-item" aria-disabled="true">
              <span>{copy.dashboard.menuTemplates}</span>
              <span className="dash-menu-meta">{copy.dashboard.templateVersion}</span>
            </button>
            <button type="button" role="menuitem" disabled className="dash-menu-item" aria-disabled="true">
              <span>{copy.dashboard.menuApiKeys}</span>
            </button>
          </div>

          <div className="dash-menu-section">
            <button type="button" role="menuitem" disabled className="dash-menu-item" aria-disabled="true">
              <span>{copy.dashboard.menuCrawler}</span>
            </button>
            <button type="button" role="menuitem" disabled className="dash-menu-item" aria-disabled="true">
              <span>{copy.dashboard.menuTheme}</span>
              <span className="dash-menu-meta">{copy.dashboard.themeActive}</span>
            </button>
            <button type="button" role="menuitem" disabled className="dash-menu-item" aria-disabled="true">
              <span>{copy.dashboard.menuShortcuts}</span>
              <span className="dash-menu-meta">{copy.dashboard.shortcutShortcuts}</span>
            </button>
          </div>

          <div className="dash-menu-section">
            <button type="button" role="menuitem" disabled className="dash-menu-item" aria-disabled="true">
              <span>{copy.dashboard.menuDocs}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="dash-menu-item"
              disabled={signingOut}
              onClick={onSignOut}
            >
              {signingOut ? copy.auth.signingOut : copy.dashboard.menuSignOut}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
