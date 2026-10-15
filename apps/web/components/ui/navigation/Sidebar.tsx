import Link from "next/link";
import { copy } from "@/copy";
import { secondaryNav, workspaceNav, type NavItem } from "./navItems";

/**
 * Product sidebar from the validated Stitch design: brand, workspace
 * navigation, secondary links, and the environment chip.
 * Pure presentational server component. Only Dashboard and Profile
 * navigate today; everything without a page renders disabled with a Soon
 * chip instead of a dead link.
 */
export default function Sidebar({ active = "dashboard" }: { active?: string }) {
  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const chip = item.soon ? <span className="dash-soon">{copy.dashboard.soonBadge}</span> : null;

    if (!item.href) {
      return (
        <button key={item.key} type="button" disabled className="dash-nav-link" aria-disabled="true">
          <Icon />
          <span>{item.label}</span>
          {chip}
        </button>
      );
    }

    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active === item.key ? "page" : undefined}
        className={`dash-nav-link ${active === item.key ? "dash-nav-link-active" : ""}`}
      >
        <Icon />
        <span>{item.label}</span>
      </Link>
    );
  }

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
        {workspaceNav.map(renderItem)}
        {secondaryNav.map(renderItem)}
      </div>

      <div className="dash-sidebar-foot">
        <span className="dash-env-chip">{copy.dashboard.envBadge}</span>
      </div>
    </nav>
  );
}
