"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { RegisteredUser } from "@/lib/api/auth";
import { Sidebar, Topbar } from "@/components/ui/navigation";
import DashboardFooter from "./DashboardFooter";

export interface DashboardShellProps {
  user: RegisteredUser;
  children: ReactNode;
  active?: string;
}

/**
 * Minimalist dashboard frame: sidebar + topbar + content + footer.
 * Client boundary is the mobile sidebar toggle only; Sidebar itself
 * and the footer stay server-renderable and JS-free.
 */
export default function DashboardShell({ user, children, active = "dashboard" }: DashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <Sidebar active={active} />
      </aside>

      {menuOpen ? (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-ink/30"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="dash-sidebar-mobile">
            <Sidebar active={active} />
          </aside>
        </div>
      ) : null}

      <div className="dash-main-col">
        <Topbar user={user} onMenuClick={() => setMenuOpen(true)} />
        <main className="dash-content">{children}</main>
        <DashboardFooter />
      </div>
    </div>
  );
}
