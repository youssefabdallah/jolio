import type { SourcePriority, SourceType } from "@/lib/api/sources";

/**
 * Display metadata for the Sources screen (no rows — rows come from
 * the API now). Technical type badges render as uppercase codes
 * (protocol tokens, kept inline by design).
 */

export const SOURCE_TYPE_CODE: Record<SourceType, string> = {
  search_engine: "SEARCH_ENGINE",
  board: "BOARD",
  ats: "ATS",
  career_page: "CAREER_PAGE",
};

export const SOURCE_TYPES: SourceType[] = ["search_engine", "board", "ats", "career_page"];

export const SOURCE_PRIORITIES: SourcePriority[] = ["T1", "T2", "T3"];

/**
 * Filter tabs map to source types (the approved schema has no section
 * column, so tabs group by type instead of the mockup's sections).
 */
export type SourcesTab = "all" | SourceType;

export const SOURCES_TABS: Array<{ value: "all" | "search_engine" | "board" | "ats" }> = [
  { value: "all" },
  { value: "search_engine" },
  { value: "board" },
  { value: "ats" },
];

/** Country codes accepted by the API (GLOBAL or ISO alpha-2). */
export const COUNTRY_OPTIONS: string[] = ["GLOBAL", "DE", "US", "GB", "FR"];

/** Editable drawer draft, submitted to the create endpoint. */
export interface SourceDraft {
  name: string;
  url: string;
  type: string;
  priority: string;
  country_code: string;
  is_enabled: boolean;
}

/** Per-field messages keyed by API detail path. */
export type SourceFieldErrors = Record<string, string>;
