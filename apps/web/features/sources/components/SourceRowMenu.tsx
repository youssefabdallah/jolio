"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { copy } from "@/copy";
import type { ApiSource } from "@/lib/api/sources";
import { IconButton } from "@/components/ui";
import { DeleteIcon, EyeIcon, MoreIcon, PencilIcon } from "@/components/icons";

export interface SourceRowMenuProps {
  row: ApiSource;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Per-row action menu (view / edit / delete with icons).
 *
 * The panel portals to the document body and anchors under the
 * trigger with fixed positioning: the table scrolls horizontally on
 * narrow screens, and an in-flow panel would be clipped by that
 * overflow container. Position re-syncs on scroll/resize and flips
 * above the trigger near the viewport bottom. Closes on outside
 * click and Escape. Kept in the sources feature: a single use does
 * not justify a second shared menu abstraction.
 */
export default function SourceRowMenu({ row, onView, onEdit, onDelete }: SourceRowMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function place(): void {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) {
        return;
      }
      const width = menuRef.current?.offsetWidth ?? 160;
      const height = menuRef.current?.offsetHeight ?? 140;
      let top = trigger.bottom + 4;
      if (top + height > window.innerHeight - 8) {
        top = Math.max(8, trigger.top - height - 4);
      }
      setPos({
        top,
        left: Math.max(8, Math.min(trigger.right - width, window.innerWidth - width - 8)),
      });
    }
    place();
    function onDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open ]);

  function pick(action: () => void): void {
    setOpen(false);
    action();
  }

  return (
    <>
      <div className="inline-block" ref={triggerRef}>
        <IconButton
          aria-label={`${copy.sources.rowActionsLabel}: ${row.name}`}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((isOpen) => !isOpen)}
        >
          <MoreIcon />
        </IconButton>
      </div>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={`${copy.sources.rowActionsLabel}: ${row.name}`}
              className="src-menu src-menu-floating"
              style={pos === null ? { visibility: "hidden" } : { top: pos.top, left: pos.left }}
            >
              <button type="button" role="menuitem" className="src-menu-item" onClick={() => pick(onView)}>
                <EyeIcon size={16} />
                <span>{copy.sources.actionView}</span>
              </button>
              <button type="button" role="menuitem" className="src-menu-item" onClick={() => pick(onEdit)}>
                <PencilIcon size={16} />
                <span>{copy.sources.actionEdit}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="src-menu-item src-menu-item-danger"
                onClick={() => pick(onDelete)}
              >
                <DeleteIcon size={16} />
                <span>{copy.sources.actionDelete}</span>
              </button>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
