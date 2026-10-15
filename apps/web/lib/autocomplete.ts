import type { ReactNode } from "react";

/**
 * One selectable row in the shared Autocomplete. Data always arrives
 * as props — callers build options from their own source (country
 * list, calling codes, skills taxonomy) and the component only
 * filters, renders, and reports the picked value.
 */
export interface AutocompleteOption {
  /** Stored value emitted through onChange. */
  value: string;
  /** Visible text in the input and the option row. */
  label: string;
  /** Extra search text (ISO codes, digits, group names). */
  keywords?: string;
  /** Small visual pinned before the label (e.g. a flag). */
  leading?: ReactNode;
  /** Small context pinned after the label (e.g. a group name). */
  hint?: string;
}

/**
 * Pure, case-insensitive substring filter over label, value,
 * keywords, and hint. An empty query returns the full list.
 */
export function filterAutocompleteOptions(
  options: AutocompleteOption[],
  needle: string
): AutocompleteOption[] {
  const query = needle.trim().toLowerCase();
  if (query === "") {
    return options;
  }
  return options.filter((option) =>
    `${option.label} ${option.value} ${option.keywords ?? ""} ${option.hint ?? ""}`
      .toLowerCase()
      .includes(query)
  );
}
