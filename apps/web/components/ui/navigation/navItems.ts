import { copy } from "@/copy";
import type { ComponentType } from "react";
import {
  ArticleIcon,
  DashboardIcon,
  HelpIcon,
  SearchIcon,
  SettingsIcon,
  TuneIcon,
  UserIcon,
  type IconProps,
} from "@/components/icons";

/**
 * Sidebar navigation data shared by the dashboard shell and the folio
 * editor shell, so both render the same product map from one source.
 * Entries without an `href` have no page yet and render disabled with a
 * Soon chip instead of a dead link.
 */
export interface NavItem {
  /** Matches the shell's `active` prop, used for aria-current. */
  key: string;
  label: string;
  icon: ComponentType<IconProps>;
  href?: string;
  soon?: boolean;
}

export const workspaceNav: NavItem[] = [
  { key: "dashboard", label: copy.dashboard.navDashboard, icon: DashboardIcon, href: "/dashboard" },
  { key: "search", label: copy.dashboard.navSearch, icon: SearchIcon, soon: true },
  { key: "applications", label: copy.dashboard.navApplications, icon: ArticleIcon, soon: true },
  { key: "profile", label: copy.dashboard.navProfile, icon: UserIcon, href: "/profile" },
  { key: "sources", label: copy.dashboard.navSources, icon: TuneIcon, soon: true },
];

export const secondaryNav: NavItem[] = [
  { key: "settings", label: copy.dashboard.navSettings, icon: SettingsIcon, soon: true },
  { key: "docs", label: copy.dashboard.navDocs, icon: HelpIcon, soon: true },
];
