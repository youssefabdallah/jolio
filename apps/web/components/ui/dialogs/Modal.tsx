"use client";

import { forwardRef, useEffect, useRef, type ReactNode } from "react";
import { copy } from "@/copy";
import { CloseIcon } from "@/components/icons";

export interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared centered dialog: scrim + Escape dismissal, focus on close,
 * labelled by its heading. Content scrolls inside a bounded card so
 * long bodies never push the actions off-screen. For destructive
 * confirmations prefer the dedicated alert dialog instead.
 */
export default function Modal({ title, onClose, children, footer }: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
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
      <div className="modal-scrim" aria-hidden="true" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="modal-card pointer-events-auto"
        >
          <div className="modal-head">
            <h2 className="text-h2 font-bold tracking-tight">{title}</h2>
            <CloseButton ref={closeRef} onClose={onClose} />
          </div>
          <div className="modal-body">{children}</div>
          {footer ? <div className="modal-foot">{footer}</div> : null}
        </div>
      </div>
    </>
  );
}

const CloseButton = forwardRef<HTMLButtonElement, { onClose: () => void }>(
  function ModalCloseButton({ onClose }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClose}
        aria-label={copy.common.closeDialog}
        className="inline-flex w-7 h-7 items-center justify-center rounded text-muted hover:text-ink hover:bg-paper transition-colors"
      >
        <CloseIcon />
      </button>
    );
  }
);
