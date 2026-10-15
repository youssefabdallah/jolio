"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { filterAutocompleteOptions, type AutocompleteOption } from "@/lib/autocomplete";

export type { AutocompleteOption };

interface AutocompleteProps {
  /** Unique base for input, list, and error ids (one instance per field). */
  id: string;
  /** Field label (always a copy.ts string at call sites). */
  label: ReactNode;
  /** Current stored value (matches an option value, or custom text). */
  value: string;
  /** Full option pool — filtering happens inside. */
  options: AutocompleteOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  autoComplete?: string;
  /** Validation message rendered under the input (field variant). */
  error?: string | null;
  /** Row shown when the filter matches nothing (always a copy.ts string). */
  emptyText: string;
  /** Strict-mode notice when blurred text matches no option. */
  invalidText?: string;
  /** True keeps unknown text on blur (skills); false reverts (country). */
  allowCustom?: boolean;
  /**
   * Menu variant trigger content (e.g. flag + calling code). When set,
   * the component renders a button trigger with the search field inside
   * the dropdown; otherwise it renders an inline combobox input.
   */
  trigger?: ReactNode;
  /** Accessible label for the menu-variant search field. */
  searchLabel?: string;
  searchPlaceholder?: string;
}

/**
 * Shared autocomplete for country, phone-code, skill-group, and skill
 * pickers. Data arrives as props; this owns only filtering, keyboard
 * support (arrows, Enter, Escape), outside-click close, and ARIA roles —
 * the same interaction CountrySelect pioneered, minus the duplication.
 */
export default function Autocomplete({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  name,
  autoComplete,
  error,
  emptyText,
  invalidText,
  allowCustom = true,
  trigger,
  searchLabel,
  searchPlaceholder,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  // Field variant mirrors the stored value as editable text; menu
  // variant keeps a separate search query and a button trigger.
  const [text, setText] = useState(value);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = `${id}-list`;
  const isMenu = trigger !== undefined;

  const labelOf = (stored: string): string =>
    options.find((option) => option.value === stored)?.label ?? stored;

  // Values arriving from outside our own commits (async load) resync the text; own keystrokes keep local state.
  const [lastProp, setLastProp] = useState(value);
  if (value !== lastProp) {
    setLastProp(value);
    if (!isMenu) {
      setText(labelOf(value));
    }
    setNotice(null);
  }

  const needle = isMenu ? query : text;
  const filtered = useMemo(() => filterAutocompleteOptions(options, needle), [options, needle]);
  const listLabel = typeof label === "string" ? label : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [open, active, listId]);

  function resetAndClose() {
    setActive(0);
    setOpen(false);
  }

  function choose(option: AutocompleteOption) {
    onChange(option.value);
    if (!isMenu) {
      setText(option.label);
    } else {
      setQuery("");
    }
    setNotice(null);
    resetAndClose();
  }

  /** Field-variant blur: keep custom text, or enforce an exact pick. */
  function commitField() {
    const current = text.trim();
    const exact = options.find(
      (option) => option.label.toLowerCase() === current.toLowerCase() || option.value.toLowerCase() === current.toLowerCase()
    );
    if (exact) {
      choose(exact);
      return;
    }
    if (allowCustom) {
      if (current !== value) {
        onChange(text);
      }
      setNotice(null);
      resetAndClose();
      return;
    }
    if (current === "") {
      setText(labelOf(value));
      setNotice(null);
      resetAndClose();
      return;
    }
    setText(labelOf(value));
    setNotice(invalidText ?? null);
    resetAndClose();
  }

  function onKey(event: React.KeyboardEvent<HTMLInputElement>, source: "field" | "search") {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const pick = filtered[Math.min(active, Math.max(filtered.length - 1, 0))];
      if (pick) {
        choose(pick);
      } else if (!isMenu && allowCustom && source === "field") {
        commitField();
      }
    } else if (event.key === "Escape") {
      if (!isMenu) {
        setText(labelOf(value));
      } else {
        setQuery("");
      }
      setOpen(false);
    }
  }

  function renderItems() {
    if (filtered.length === 0) {
      return (
        <li className="px-3 py-2 text-body text-muted" role="presentation">
          {emptyText}
        </li>
      );
    }
    return filtered.map((option, index) => {
      const key = `${option.value}::${option.hint ?? ""}::${index}`;
      return (
        <li key={key} role="presentation">
          <button
            type="button"
            id={`${listId}-${index}`}
            role="option"
            aria-selected={option.value === value}
            className={`dash-menu-item ${index === active ? "bg-paper" : ""}`}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActive(index)}
            onClick={() => choose(option)}
          >
            {option.leading ? <span aria-hidden="true">{option.leading}</span> : null}
            <span>{option.label}</span>
            {option.hint ? (
              <span className="ml-auto font-mono text-caption text-muted pl-3">{option.hint}</span>
            ) : null}
          </button>
        </li>
      );
    });
  }

  if (isMenu) {
    return (
      <div ref={rootRef} className="relative">
        <span className="label" id={`${id}-label`} aria-hidden="true">
          {label}
        </span>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${id}-label`}
          className="select justify-start gap-1.5 font-mono"
          onClick={() => {
            setOpen((wasOpen) => !wasOpen);
            setQuery("");
            setActive(0);
            if (!open) {
              requestAnimationFrame(() => searchRef.current?.focus());
            }
          }}
        >
          {trigger}
        </button>

        {open ? (
          <div className="dash-menu !w-64 left-0 right-auto">
            <div className="px-2 pb-2">
              <label className="sr-only" htmlFor={`${id}-search`}>
                {searchLabel}
              </label>
              <input
                ref={searchRef}
                id={`${id}-search`}
                type="search"
                autoComplete="off"
                role="searchbox"
                aria-controls={listId}
                aria-activedescendant={`${listId}-${active}`}
                placeholder={searchPlaceholder}
                className="dash-search-input input"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={(event) => onKey(event, "search")}
              />
            </div>
            <ul id={listId} role="listbox" aria-label={listLabel} className="max-h-56 overflow-y-auto">
              {renderItems()}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  const shown = error ?? notice;
  return (
    <div ref={rootRef} className="relative">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={`${listId}-${active}`}
        aria-describedby={shown ? `${id}-error` : undefined}
        aria-invalid={shown ? true : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="input"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setNotice(null);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          commitField();
          setOpen(false);
        }}
        onKeyDown={(event) => onKey(event, "field")}
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={listLabel}
          className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-card border border-rule rounded-control shadow-lg"
        >
          {renderItems()}
        </ul>
      ) : null}
      {shown ? (
        <p id={`${id}-error`} className="field-alert">
          {shown}
        </p>
      ) : null}
    </div>
  );
}
