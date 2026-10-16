"use client";

import { useEffect, useRef, useState } from "react";
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
 * Closes on outside click and Escape; focus stays on the trigger.
 * Kept in the sources feature: a single use does not justify a
 * second shared menu abstraction.
 */
export default function SourceRowMenu({ row, onView, onEdit, onDelete }: SourceRowMenuProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDown(event: MouseEvent): void {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
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
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  function pick(action: () => void): void {
    setOpen(false);
    action();
  }

  return (
    <div className="relative inline-block" ref={boxRef}>
      <IconButton
        aria-label={`${copy.sources.rowActionsLabel}: ${row.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <MoreIcon />
      </IconButton>
      {open ? (
        <div role="menu" aria-label={`${copy.sources.rowActionsLabel}: ${row.name}`} className="src-menu">
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
        </div>
      ) : null}
    </div>
  );
}
