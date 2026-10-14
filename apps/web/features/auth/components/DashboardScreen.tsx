"use client";

import { copy } from "@/copy";
import type { RegisteredUser } from "@/lib/api/auth";
import { DashboardShell } from "@/components/ui/layout";
import {
  ArchiveIcon,
  ArrowRightIcon,
  ArticleIcon,
  CheckCircleIcon,
  RefreshIcon,
  SearchIcon,
  TerminalIcon,
  TuneIcon,
} from "@/components/icons";

/**
 * Dashboard from the validated Stitch design: welcome telemetry, three
 * overview cards, and the dispatch feed.
 *
 * NOTE (mock data): metric and feed values mirror the Stitch mock until
 * Search, Tracker, and Profile APIs ship — they are static strings, not
 * live backend state. Actions render disabled instead of dead links.
 */
export default function DashboardScreen({ user }: { user: RegisteredUser }) {
  return (
    <DashboardShell user={user}>
      <section className="dash-hero" aria-labelledby="dashboard-welcome">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="dashboard-welcome" className="text-h1 font-bold text-ink">
              {copy.dashboard.welcomeTitle}
            </h1>
            <p className="text-body text-muted mt-2">{copy.dashboard.welcomeBody}</p>
          </div>
          <button type="button" disabled className="btn-primary" aria-disabled="true">
            <RefreshIcon size={16} />
            <span className="ml-2">{copy.dashboard.runPipeline}</span>
          </button>
        </div>
        <div className="dash-telemetry">
          <span className="dash-telemetry-item">
            <span className="dash-telemetry-dot" aria-hidden="true" />
            {copy.dashboard.telemetryCrawler}
          </span>
          <span className="dash-telemetry-item">
            <CheckCircleIcon size={14} aria-hidden="true" />
            {copy.dashboard.telemetryProfile}
          </span>
          <span className="dash-telemetry-item">{copy.dashboard.telemetrySync}</span>
          <span className="dash-telemetry-item">{copy.dashboard.telemetryRegion}</span>
        </div>
      </section>

      <section className="dash-card-grid" aria-label={copy.dashboard.title}>
        <article className="card">
          <div className="flex items-center justify-between gap-2">
            <SearchIcon />
            <span className="chip chip-verified">{copy.dashboard.cardSearchChip}</span>
          </div>
          <h2 className="card-title mt-3">{copy.dashboard.cardSearchTitle}</h2>
          <p className="text-body text-muted">{copy.dashboard.cardSearchBody}</p>
          <p className="dash-metric">{copy.dashboard.cardSearchMetric}</p>
          <p className="dash-metric-label">{copy.dashboard.cardSearchFilters}</p>
          <div className="dash-card-action">
            <button type="button" disabled className="btn-secondary w-full" aria-disabled="true">
              <span>{copy.dashboard.cardSearchAction}</span>
              <ArrowRightIcon size={16} className="ml-1.5" />
            </button>
          </div>
        </article>

        <article className="card">
          <div className="flex items-center justify-between gap-2">
            <ArticleIcon />
            <span className="chip chip-verified">{copy.dashboard.cardApplicationsChip}</span>
          </div>
          <h2 className="card-title mt-3">{copy.dashboard.cardApplicationsTitle}</h2>
          <p className="text-body text-muted">{copy.dashboard.cardApplicationsBody}</p>
          <p className="dash-metric">{copy.dashboard.cardApplicationsMetric}</p>
          <p className="dash-breakdown">
            <span className="dash-breakdown-staged">{copy.dashboard.breakdownStaged}</span>
            <span className="dash-breakdown-applied">{copy.dashboard.breakdownApplied}</span>
            <span className="dash-breakdown-skipped">{copy.dashboard.breakdownSkipped}</span>
            <span className="dash-breakdown-rejected">{copy.dashboard.breakdownRejected}</span>
          </p>
          <div className="dash-card-action">
            <button type="button" disabled className="btn-secondary w-full" aria-disabled="true">
              <span>{copy.dashboard.cardApplicationsAction}</span>
              <ArrowRightIcon size={16} className="ml-1.5" />
            </button>
          </div>
        </article>

        <article className="card">
          <div className="flex items-center justify-between gap-2">
            <TuneIcon />
            <span className="chip chip-verified">{copy.dashboard.cardProfileChip}</span>
          </div>
          <h2 className="card-title mt-3">{copy.dashboard.cardProfileTitle}</h2>
          <p className="text-body text-muted">{copy.dashboard.cardProfileBody}</p>
          <p className="dash-metric">{copy.dashboard.cardProfileMetric}</p>
          <p className="dash-metric-label">
            {copy.dashboard.cardProfileAts} · {copy.dashboard.cardProfileProofs}
          </p>
          <div className="dash-card-action">
            <button type="button" disabled className="btn-secondary w-full" aria-disabled="true">
              <span>{copy.dashboard.cardProfileAction}</span>
              <ArrowRightIcon size={16} className="ml-1.5" />
            </button>
          </div>
        </article>
      </section>

      <section className="card" aria-labelledby="dashboard-feed">
        <div className="flex items-center justify-between gap-2">
          <h2 id="dashboard-feed" className="card-title !mb-0">
            {copy.dashboard.feedTitle}
          </h2>
          <span className="chip chip-danger">{copy.dashboard.feedLive}</span>
        </div>
        <p className="text-body text-muted mt-2">{copy.dashboard.feedBody}</p>
        <ul className="mt-4">
          <li className="row-item !px-0">
            <span className="shrink-0 text-muted" aria-hidden="true">
              <TerminalIcon />
            </span>
            <div className="ml-3 min-w-0">
              <p className="text-body font-bold text-ink truncate">
                {copy.dashboard.feedRow1Company} / {copy.dashboard.feedRow1Role}
              </p>
              <p className="font-mono text-caption text-muted truncate">{copy.dashboard.feedRow1File}</p>
            </div>
            <span className="ml-auto flex items-center gap-2 pl-3">
              <span className="chip chip-staged">{copy.dashboard.feedRow1Status}</span>
              <span className="font-mono text-caption text-muted whitespace-nowrap">
                {copy.dashboard.feedRow1Time}
              </span>
            </span>
          </li>
          <li className="row-item !px-0">
            <CheckCircleIcon />
            <div className="ml-3 min-w-0">
              <p className="text-body font-bold text-ink truncate">
                {copy.dashboard.feedRow2Company} / {copy.dashboard.feedRow2Role}
              </p>
              <p className="font-mono text-caption text-muted truncate">{copy.dashboard.feedRow2File}</p>
            </div>
            <span className="ml-auto flex items-center gap-2 pl-3">
              <span className="chip chip-verified">{copy.dashboard.feedRow2Status}</span>
              <span className="font-mono text-caption text-muted whitespace-nowrap">
                {copy.dashboard.feedRow2Time}
              </span>
            </span>
          </li>
          <li className="row-item !px-0">
            <ArchiveIcon />
            <div className="ml-3 min-w-0">
              <p className="text-body font-bold text-ink truncate">
                {copy.dashboard.feedRow3Company} / {copy.dashboard.feedRow3Role}
              </p>
              <p className="font-mono text-caption text-muted truncate">{copy.dashboard.feedRow3File}</p>
            </div>
            <span className="ml-auto flex items-center gap-2 pl-3">
              <span className="chip chip-neutral">{copy.dashboard.feedRow3Status}</span>
              <span className="font-mono text-caption text-muted whitespace-nowrap">
                {copy.dashboard.feedRow3Time}
              </span>
            </span>
          </li>
        </ul>
      </section>
    </DashboardShell>
  );
}
