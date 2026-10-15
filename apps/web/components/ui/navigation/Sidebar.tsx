import Link from "next/link";
import { copy } from "@/copy";
import {
  ArticleIcon,
  DashboardIcon,
  HelpIcon,
  SearchIcon,
  SettingsIcon,
  TuneIcon,
  UserIcon,
} from "@/components/icons";

/**
 * Product sidebar from the validated Stitch design: brand, workspace
 * navigation, secondary links, and the environment chip.
 * Pure presentational server component. Only Dashboard navigates
 * today; everything without a page renders disabled with a Soon chip
 * instead of a dead link.
 */
export default function Sidebar({ active = "dashboard" }: { active?: string }) {
  return (
    <nav className="flex flex-col h-full" aria-label={copy.dashboard.navSection}>
      <div className="dash-sidebar-brand">
        <span className="dash-brand-mark" aria-hidden="true">
          {copy.auth.brandInitial}
        </span>
        <span>
          <span className="block text-body font-bold text-ink leading-none">
            {copy.auth.brandName}
          </span>
          <span className="block font-mono text-caption text-muted mt-1 leading-none">
            {copy.dashboard.brandVersion}
          </span>
        </span>
      </div>

      <div className="dash-nav">
        <p className="dash-nav-section">{copy.dashboard.navSection}</p>

        <Link
          href="/dashboard"
          aria-current={active === "dashboard" ? "page" : undefined}
          className={`dash-nav-link ${active === "dashboard" ? "dash-nav-link-active" : ""}`}
        >
          <DashboardIcon />
          <span>{copy.dashboard.navDashboard}</span>
        </Link>

        <button type="button" disabled className="dash-nav-link" aria-disabled="true">
          <SearchIcon />
          <span>{copy.dashboard.navSearch}</span>
          <span className="dash-soon">{copy.dashboard.soonBadge}</span>
        </button>

        <button type="button" disabled className="dash-nav-link" aria-disabled="true">
          <ArticleIcon />
          <span>{copy.dashboard.navApplications}</span>
          <span className="dash-soon">{copy.dashboard.soonBadge}</span>
        </button>

        <Link
          href="/profile"
          aria-current={active === "profile" ? "page" : undefined}
          className={`dash-nav-link ${active === "profile" ? "dash-nav-link-active" : ""}`}
        >
          <UserIcon />
          <span>{copy.dashboard.navProfile}</span>
        </Link>

        <button type="button" disabled className="dash-nav-link" aria-disabled="true">
          <TuneIcon />
          <span>{copy.dashboard.navSources}</span>
          <span className="dash-soon">{copy.dashboard.soonBadge}</span>
        </button>

        <button type="button" disabled className="dash-nav-link" aria-disabled="true">
          <SettingsIcon />
          <span>{copy.dashboard.navSettings}</span>
          <span className="dash-soon">{copy.dashboard.soonBadge}</span>
        </button>

        <button type="button" disabled className="dash-nav-link" aria-disabled="true">
          <HelpIcon />
          <span>{copy.dashboard.navDocs}</span>
          <span className="dash-soon">{copy.dashboard.soonBadge}</span>
        </button>
      </div>

      <div className="dash-sidebar-foot">
        <span className="dash-env-chip">{copy.dashboard.envBadge}</span>
      </div>
    </nav>
  );
}
