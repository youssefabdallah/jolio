"use client";

import { useEffect, useRef, useState } from "react";
import { copy } from "@/copy";
import type { ApiSource } from "@/lib/api/sources";
import { CloseIcon, DeleteIcon } from "@/components/icons";
import { FormError } from "@/components/ui";
import {
  COUNTRY_OPTIONS,
  SOURCE_PRIORITIES,
  SOURCE_TYPES,
  SOURCE_TYPE_CODE,
  type SourceDraft,
  type SourceFieldErrors,
} from "../sourceMeta";

export interface SourceDrawerProps {
  /** Null renders the blank "New source" draft. */
  source: ApiSource | null;
  errors: SourceFieldErrors;
  serverError: string | null;
  saving: boolean;
  onSave: (draft: SourceDraft) => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * Registry edit drawer: name, URL, type and priority controls,
 * country select, the enabled switch, and the delete/cancel/save
 * footer.
 *
 * Field edits live in local draft state; validation messages arrive
 * as props so the screen (which owns submission) maps client and
 * server failures onto the same inputs.
 */
export default function SourceDrawer({
  source,
  errors,
  serverError,
  saving,
  onSave,
  onDelete,
  onClose,
}: SourceDrawerProps) {
  const isNew = source === null;
  const [name, setName] = useState(source?.name ?? "");
  const [url, setUrl] = useState(source?.url ?? "");
  const [type, setType] = useState<string>(source?.type ?? "board");
  const [priority, setPriority] = useState<string>(source?.priority ?? "T2");
  const [country, setCountry] = useState(source?.country_code ?? "GLOBAL");
  const [enabled, setEnabled] = useState(source?.is_enabled ?? true);
  const closeRef = useRef<HTMLButtonElement>(null);

  const dirty =
    name !== (source?.name ?? "") ||
    url !== (source?.url ?? "") ||
    type !== (source?.type ?? "board") ||
    priority !== (source?.priority ?? "T2") ||
    country !== (source?.country_code ?? "GLOBAL") ||
    enabled !== (source?.is_enabled ?? true);

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

  function fieldError(path: string): string | null {
    return errors[path] ?? null;
  }

  const title = isNew ? copy.sources.newTitle : copy.sources.editTitle;

  return (
    <>
      <div className="src-scrim" aria-hidden="true" onClick={onClose} />
      <aside className="src-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="src-drawer-head">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-h2 font-bold tracking-tight">{title}</h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={copy.sources.closeDrawer}
              className="inline-flex w-7 h-7 items-center justify-center rounded text-muted hover:text-ink hover:bg-paper transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="chip chip-info">
              TYPE: {SOURCE_TYPE_CODE[type as keyof typeof SOURCE_TYPE_CODE] ?? type}
            </span>
            <span className="chip chip-neutral">{country}</span>
          </div>
        </div>

        <div className="src-drawer-body">
          <FormError message={serverError} />

          <div className="space-y-1">
            <label className="src-field-label" htmlFor="source-name">
              {copy.sources.nameLabel}
            </label>
            <input
              id="source-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={fieldError("name") ? true : undefined}
              aria-describedby={fieldError("name") ? "source-name-error" : undefined}
              className={`input h-8 ${fieldError("name") ? "src-input-error" : ""}`}
            />
            {fieldError("name") ? (
              <p id="source-name-error" className="field-alert">
                {fieldError("name")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="src-field-label" htmlFor="source-url">
              {copy.sources.urlLabel}
            </label>
            <input
              id="source-url"
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              aria-invalid={fieldError("url") ? true : undefined}
              aria-describedby={fieldError("url") ? "source-url-error" : undefined}
              className={`input h-8 font-mono ${fieldError("url") ? "src-input-error" : ""}`}
            />
            {fieldError("url") ? (
              <p id="source-url-error" className="field-alert">
                {fieldError("url")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <span className="src-field-label" id="source-type-label">
              {copy.sources.typeLabel}
            </span>
            <div
              className="src-segmented grid-cols-4"
              role="group"
              aria-labelledby="source-type-label"
            >
              {SOURCE_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={type === option}
                  onClick={() => setType(option)}
                  className={type === option ? "is-on" : undefined}
                >
                  {SOURCE_TYPE_CODE[option]}
                </button>
              ))}
            </div>
            {fieldError("type") ? <p className="field-alert">{fieldError("type")}</p> : null}
          </div>

          <div className="space-y-1">
            <span className="src-field-label" id="source-priority-label">
              {copy.sources.priorityLabel}
            </span>
            <div
              className="src-segmented grid-cols-3"
              role="group"
              aria-labelledby="source-priority-label"
            >
              {SOURCE_PRIORITIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={priority === option}
                  onClick={() => setPriority(option)}
                  className={priority === option ? "is-on" : undefined}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="src-field-hint">{copy.sources.priorityHint}</p>
            {fieldError("priority") ? (
              <p className="field-alert">{fieldError("priority")}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="src-field-label" htmlFor="source-country">
              {copy.sources.countryLabel}
            </label>
            <select
              id="source-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              aria-invalid={fieldError("country_code") ? true : undefined}
              className="input h-8"
            >
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="src-field-hint">{copy.sources.countryHint}</p>
            {fieldError("country_code") ? (
              <p className="field-alert">{fieldError("country_code")}</p>
            ) : null}
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <div>
              <span className="src-field-label">{copy.sources.enabledLabel}</span>
              <p className="src-field-hint">{copy.sources.enabledHint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={copy.sources.enabledLabel}
              onClick={() => setEnabled((on) => !on)}
              className={`src-switch ${enabled ? "is-on" : ""}`}
            >
              <span className="src-switch-knob" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="src-drawer-foot">
          {!isNew ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-caption text-danger hover:text-danger-deep transition-colors"
            >
              <DeleteIcon size={16} />
              <span>{copy.sources.deleteSource}</span>
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {dirty ? (
              <span className="src-unsaved">
                <span className="src-unsaved-dot" aria-hidden="true" />
                <span>{copy.sources.unsavedChanges}</span>
              </span>
            ) : null}
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={onClose}
              disabled={saving}
            >
              {copy.sources.cancel}
            </button>
            <button
              type="button"
              className="btn-primary btn-sm"
              disabled={saving}
              onClick={() => {
                onSave({ name, url, type, priority, country_code: country, is_enabled: enabled });
              }}
            >
              {saving ? copy.sources.savingSource : copy.sources.saveSource}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
