"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { copy } from "@/copy";
import { ApiError } from "@/lib/api/client";
import {
  countSources,
  createSource,
  deleteSource,
  listSources,
  updateSource,
  type ApiSource,
  type SourcesPage,
} from "@/lib/api/sources";
import { sourceSchema } from "@/lib/validation/sources";
import { Button, Modal } from "@/components/ui";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { SOURCES_TABS, SOURCE_TYPE_CODE, type SourceDraft, type SourceFieldErrors, type SourcesTab } from "../sourceMeta";
import SourceDrawer from "./SourceDrawer";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import SourceRowMenu from "./SourceRowMenu";
import SourceDetail from "./SourceDetail";

const DEFAULT_PER_PAGE = 10;

const PER_PAGE_OPTIONS = [10, 25, 50];

/** Compact page list: all numbers up to 7 pages, windowed beyond that. */
function pageItems(current: number, last: number): Array<number | "ellipsis"> {
  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }
  const wanted = new Set([1, current - 1, current, current + 1, last]);
  const numbers = [...wanted].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  let previous = 0;
  for (const n of numbers) {
    if (n - previous > 1) {
      items.push("ellipsis");
    }
    items.push(n);
    previous = n;
  }
  return items;
}

/**
 * Sources registry screen: server-paged rows, server filter tabs and
 * search, and the create/edit flows through the drawer.
 *
 * Data states are explicit (loading / failed-retry / empty / rows).
 * Page, page size, tab, and the debounced search travel to the API as
 * query params; tab counts come from lightweight totals queries.
 * Saving validates with the shared yup schema first, then maps
 * backend 409 conflicts and 422 field details onto the same drawer
 * inputs; anything unmappable falls back to the top-level error.
 */
export default function SourcesScreen() {
  const router = useRouter();
  const [pageData, setPageData] = useState<SourcesPage | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<SourcesTab>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [tabCounts, setTabCounts] = useState<Record<SourcesTab, number | null>>({
    all: null,
    search_engine: null,
    board: null,
    ats: null,
    career_page: null,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftNew, setDraftNew] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SourceFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ApiSource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [detailSource, setDetailSource] = useState<ApiSource | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const result = await listSources({
          page,
          perPage,
          type: tab === "all" ? undefined : tab,
          search: debouncedQuery === "" ? undefined : debouncedQuery,
        });
        if (!cancelled) {
          setPageData(result);
          setLoadError(false);
        }
      } catch (thrown) {
        if (cancelled) {
          return;
        }
        if (thrown instanceof ApiError && thrown.status === 401) {
          router.replace("/");
          return;
        }
        setLoadError(true);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [router, retryKey, refreshKey, page, perPage, tab, debouncedQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadCounts(): Promise<void> {
      try {
        const search = debouncedQuery === "" ? undefined : debouncedQuery;
        const [all, searchEngines, boards, ats] = await Promise.all([
          countSources({ search }),
          countSources({ search, type: "search_engine" }),
          countSources({ search, type: "board" }),
          countSources({ search, type: "ats" }),
        ]);
        if (!cancelled) {
          setTabCounts({ all, search_engine: searchEngines, board: boards, ats, career_page: null });
        }
      } catch {
        // Counts are decorative: the table error state covers failures.
      }
    }

    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const rows = pageData?.rows ?? [];
  const selected: ApiSource | null = rows.find((row) => row.id === selectedId) ?? null;

  function openRow(row: ApiSource): void {
    setDetailSource(null);
    setSelectedId(row.id);
    setDraftNew(false);
    setFieldErrors({});
    setServerError(null);
    setDrawerOpen(true);
  }

  function openNew(): void {
    setSelectedId(null);
    setDraftNew(true);
    setFieldErrors({});
    setServerError(null);
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setFieldErrors({});
    setServerError(null);
    setSaving(false);
  }

  async function handleSave(draft: SourceDraft): Promise<void> {
    setFieldErrors({});
    setServerError(null);
    setSaving(true);

    try {
      const values = (await sourceSchema().validate(draft, { abortEarly: false })) as {
        name: unknown;
        url: unknown;
        type: unknown;
        priority: unknown;
        country_code: unknown;
        is_enabled: unknown;
      };
      const input = {
        name: String(values.name),
        url: String(values.url),
        type: String(values.type),
        priority: String(values.priority),
        country_code: String(values.country_code),
        is_enabled: Boolean(values.is_enabled),
      };
      if (draftNew || selected === null) {
        await createSource(input);
      } else {
        await updateSource(selected.id, input);
      }
      closeDrawer();
      setRefreshKey((k) => k + 1);
    } catch (thrown) {
      setSaving(false);
      if (thrown instanceof yup.ValidationError) {
        const mapped: SourceFieldErrors = {};
        for (const issue of thrown.inner) {
          if (issue.path && !(issue.path in mapped)) {
            mapped[issue.path] = issue.message;
          }
        }
        setFieldErrors(mapped);
        return;
      }
      if (thrown instanceof ApiError && thrown.status === 401) {
        router.replace("/");
        return;
      }
      if (thrown instanceof ApiError && thrown.status === 422 && thrown.body.details) {
        const mapped: SourceFieldErrors = {};
        for (const [path, messages] of Object.entries(thrown.body.details)) {
          if (!(path in mapped)) {
            mapped[path] = messages[0] ?? thrown.body.message;
          }
        }
        setFieldErrors(mapped);
        return;
      }
      setServerError(
        thrown instanceof ApiError ? thrown.message : copy.sources.createFailed
      );
    }
  }

  function askDelete(row: ApiSource): void {
    setDeleteError(null);
    setPendingDelete(row);
  }

  async function confirmDelete(): Promise<void> {
    if (pendingDelete === null) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteSource(pendingDelete.id);
      if (selectedId === pendingDelete.id) {
        setSelectedId(null);
        setDrawerOpen(false);
      }
      if (detailSource?.id === pendingDelete.id) {
        setDetailSource(null);
      }
      setPendingDelete(null);
      if (rows.length <= 1 && page > 1) {
        setPage(page - 1);
      } else {
        setRefreshKey((k) => k + 1);
      }
    } catch (thrown) {
      if (thrown instanceof ApiError && thrown.status === 401) {
        router.replace("/");
        return;
      }
      setDeleteError(thrown instanceof ApiError ? thrown.message : copy.sources.createFailed);
    } finally {
      setDeleting(false);
    }
  }

  const tabLabel: Record<(typeof SOURCES_TABS)[number]["value"], string> = {
    all: copy.sources.tabAll,
    search_engine: copy.sources.tabSearchEngines,
    board: copy.sources.tabJobBoards,
    ats: copy.sources.tabDirectAts,
  };

  if (pageData === null && !loadError) {
    return (
      <div className="src-page">
        <p className="text-body text-muted">{copy.sources.loading}</p>
      </div>
    );
  }

  if (loadError || pageData === null) {
    return (
      <div className="src-page">
        <div className="card max-w-auth text-center mx-auto">
          <p className="text-body text-ink">{copy.sources.loadFailed}</p>
          <div className="pt-4">
            <Button
              onClick={() => {
                setPageData(null);
                setLoadError(false);
                setRetryKey((k) => k + 1);
              }}
            >
              {copy.common.tryAgain}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filtering = tab !== "all" || debouncedQuery !== "";

  return (
    <div className="src-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold tracking-tight">{copy.sources.title}</h1>
        <p className="text-body text-ink-soft">{copy.sources.subtitle}</p>
      </div>

      <div className="src-toolbar">
        <div className="src-tabs" role="group" aria-label={copy.sources.title}>
          {SOURCES_TABS.map(({ value }) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => {
                setTab(value);
                setPage(1);
              }}
              className={`src-tab ${tab === value ? "src-tab-active" : ""}`}
            >
              {tabLabel[value]}{" "}
              <span aria-hidden="true">
                ({tabCounts[value] === null ? "…" : tabCounts[value]})
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div role="search" className="relative">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <label htmlFor="sources-filter" className="sr-only">
              {copy.sources.filterLabel}
            </label>
            <input
              id="sources-filter"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.sources.filterPlaceholder}
              className="input h-8 w-48 pl-8"
            />
          </div>
          <button type="button" className="btn-primary btn-sm" onClick={openNew}>
            <PlusIcon size={16} />
            <span>{copy.sources.newSource}</span>
          </button>
        </div>
      </div>

      {pageData.total === 0 ? (
        <div className="card text-center">
          <p className="text-h2 font-bold">
            {filtering ? copy.sources.emptySearchTitle : copy.sources.emptyTitle}
          </p>
          <p className="text-body text-ink-soft pt-1">
            {filtering ? copy.sources.emptySearchBody : copy.sources.emptyBody}
          </p>
          {!filtering ? (
            <div className="pt-4">
              <button type="button" className="btn-primary btn-sm" onClick={openNew}>
                <PlusIcon size={16} />
                <span>{copy.sources.newSource}</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="src-table-card">
          <div className="src-table-scroll">
            <table className="src-table">
              <thead>
                <tr>
                  <th scope="col">{copy.sources.colSource}</th>
                  <th scope="col">{copy.sources.colType}</th>
                  <th scope="col">{copy.sources.colPriority}</th>
                  <th scope="col">{copy.sources.colSuccess}</th>
                  <th scope="col">{copy.sources.colLastRun}</th>
                  <th scope="col">{copy.sources.colStatus}</th>
                  <th scope="col">
                    <span className="sr-only">{copy.sources.colActions}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isSelected = row.id === selectedId && drawerOpen && !draftNew;
                  return (
                    <tr
                      key={row.id}
                      className={isSelected ? "src-row-selected" : undefined}
                    >
                      <td className="font-medium">
                        {isSelected ? <span className="src-row-dot" aria-hidden="true" /> : null}
                        {row.name}
                      </td>
                      <td>
                        <span
                          className={`src-type-badge ${row.type === "search_engine" ? "src-type-search" : ""}`}
                        >
                          {SOURCE_TYPE_CODE[row.type]}
                        </span>
                      </td>
                      <td className="src-priority">{row.priority}</td>
                      {/* Telemetry is derived from search runs, not stored:
                          placeholders until Discovery ships. */}
                      <td className="font-mono text-muted">—</td>
                      <td className="font-mono text-muted">—</td>
                      <td className="font-mono text-muted">—</td>
                      <td className="text-right">
                        <SourceRowMenu
                          row={row}
                          onView={() => {
                            setDrawerOpen(false);
                            setDetailSource(row);
                          }}
                          onEdit={() => openRow(row)}
                          onDelete={() => askDelete(row)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pageData.total > 0 ? (
        <nav className="src-pagination" aria-label={copy.sources.pagesLabel}>
          <p className="font-mono text-caption text-muted" aria-live="polite">
            {copy.sources.showing
              .replace("{from}", String(pageData.from ?? 0))
              .replace("{to}", String(pageData.to ?? 0))
              .replace("{total}", String(pageData.total))}
          </p>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="sources-per-page">
              {copy.sources.rowsPerPage}
            </label>
            <select
              id="sources-per-page"
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setPage(1);
              }}
              className="input h-8 w-auto"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                {copy.sources.previous}
              </button>
              {pageItems(page, pageData.lastPage).map((item, index) =>
                item === "ellipsis" ? (
                  <span key={`gap-${index}`} className="px-1 text-muted" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    aria-label={copy.sources.pageNumber.replace("{page}", String(item))}
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => setPage(item)}
                    className={`src-page-btn ${item === page ? "is-on" : ""}`}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={page >= pageData.lastPage}
                onClick={() => setPage(page + 1)}
              >
                {copy.sources.next}
              </button>
            </div>
          </div>
        </nav>
      ) : null}

      {drawerOpen ? (
        <SourceDrawer
          key={draftNew ? "new" : (selected?.id ?? "new")}
          source={draftNew ? null : selected}
          errors={fieldErrors}
          serverError={serverError}
          saving={saving}
          onSave={handleSave}
          onDelete={() => {
            if (selected !== null) {
              askDelete(selected);
            }
          }}
          onClose={closeDrawer}
        />
      ) : null}
      {pendingDelete !== null ? (
        <DeleteConfirmDialog
          sourceName={pendingDelete.name}
          deleting={deleting}
          serverError={deleteError}
          onConfirm={confirmDelete}
          onClose={() => {
            if (!deleting) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
        />
      ) : null}
      {detailSource !== null ? (
        <Modal title={copy.sources.detailTitle} onClose={() => setDetailSource(null)}>
          <SourceDetail source={detailSource} />
        </Modal>
      ) : null}
    </div>
  );
}
