"use client";

import { useEffect, useRef } from "react";
import { copy } from "@/copy";

export interface DeleteConfirmDialogProps {
  /** Row pending deletion; the name renders inside the warning. */
  sourceName: string;
  deleting: boolean;
  serverError: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Destructive-action confirmation for one registry entry.
 * Alert dialog with scrim + Escape dismissal; focus lands on Cancel
 * (the safe choice) and Confirm stays disabled while deleting.
 */
export default function DeleteConfirmDialog({
  sourceName,
  deleting,
  serverError,
  onConfirm,
  onClose,
}: DeleteConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="src-confirm-scrim" aria-hidden="true" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-source-title"
          aria-describedby="delete-source-body"
          className="card pointer-events-auto w-full max-w-sm space-y-4"
        >
          <h2 id="delete-source-title" className="text-h2 font-bold tracking-tight">
            {copy.sources.deleteTitle}
          </h2>
          <p id="delete-source-body" className="text-body text-ink-soft">
            {copy.sources.deleteBody.replace("{name}", sourceName)}
          </p>
          {serverError ? (
            <p role="alert" className="field-alert">
              {serverError}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-3">
            <button
              ref={cancelRef}
              type="button"
              className="btn-secondary btn-sm"
              onClick={onClose}
              disabled={deleting}
            >
              {copy.sources.cancel}
            </button>
            <button
              type="button"
              className="btn-danger btn-sm"
              onClick={onConfirm}
              disabled={deleting}
            >
              {deleting ? copy.sources.deleting : copy.sources.confirmDelete}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
