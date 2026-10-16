import { deleteVoid, getPaginated, postJson } from "./client";

export type SourceType = "search_engine" | "board" | "ats" | "career_page";

export type SourcePriority = "T1" | "T2" | "T3";

/** One registry entry as the API returns it. */
export interface ApiSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  priority: SourcePriority;
  country_code: string;
  is_enabled: boolean;
}

/** Full-document payload the drawer submits (create and replace). */
export interface SourceInput {
  name: string;
  url: string;
  type: string;
  priority: string;
  country_code: string;
  is_enabled: boolean;
}

/**
 * One page of the registry: rows plus the paginator position the
 * indicators render from.
 */
export interface SourcesPage {
  rows: ApiSource[];
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  from: number | null;
  to: number | null;
}

export interface ListSourcesParams {
  page?: number;
  perPage?: number;
  type?: string;
  search?: string;
}

/**
 * List the caller's registry in run order, paged by the backend.
 * Telemetry (success rate, last run, status) is not part of the
 * response — the backend derives it from search runs, so the table
 * shows placeholders until then.
 */
export async function listSources(params: ListSourcesParams = {}): Promise<SourcesPage> {
  const query = new URLSearchParams();
  if (params.page !== undefined) {
    query.set("page", String(params.page));
  }
  if (params.perPage !== undefined) {
    query.set("per_page", String(params.perPage));
  }
  if (params.type) {
    query.set("type", params.type);
  }
  if (params.search !== undefined && params.search.trim() !== "") {
    query.set("search", params.search.trim());
  }
  const suffix = query.size > 0 ? `?${query}` : "";
  const { items, meta } = await getPaginated<ApiSource>(`/api/sources${suffix}`);
  return {
    rows: items,
    total: meta.total,
    currentPage: meta.current_page,
    lastPage: meta.last_page,
    perPage: meta.per_page,
    from: meta.from,
    to: meta.to,
  };
}

/** Total rows for a filter set (per-page 1 keeps the payload tiny). */
export async function countSources(params: { type?: string; search?: string } = {}): Promise<number> {
  const page = await listSources({ ...params, page: 1, perPage: 1 });
  return page.total;
}

/** Add one registry entry; throws ApiError (409 taken, 422 invalid). */
export async function createSource(input: SourceInput): Promise<ApiSource> {
  const payload = await postJson<{ source: ApiSource }>("/api/sources", input);
  return payload.source;
}

/** Replace one registry entry in full; throws ApiError (404, 409, 422). */
export async function updateSource(id: string, input: SourceInput): Promise<ApiSource> {
  const payload = await postJson<{ source: ApiSource }>(
    `/api/sources/${encodeURIComponent(id)}`,
    input,
    "PUT"
  );
  return payload.source;
}

/** Hard-delete one registry entry; throws ApiError (404). */
export async function deleteSource(id: string): Promise<void> {
  await deleteVoid(`/api/sources/${encodeURIComponent(id)}`);
}
