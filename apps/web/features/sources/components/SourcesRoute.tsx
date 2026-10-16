"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/copy";
import { me, type RegisteredUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { DashboardShell } from "@/components/ui/layout";
import SourcesScreen from "./SourcesScreen";

/**
 * Sources route: session gate then the design-preview screen.
 * Mirrors the dashboard gate: a dead session bounces to sign-in,
 * outages go to the unavailable notice with the cookie kept.
 * Rows are static mock data — no API calls until the design is
 * approved and the wiring lands.
 */
export function SourcesRoute() {
  const router = useRouter();
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolveSession(): Promise<void> {
      try {
        const result = await me();
        if (!cancelled) {
          if (result) {
            setUser(result.user);
          } else {
            router.replace("/");
          }
        }
      } catch (thrown) {
        if (!cancelled) {
          if (thrown instanceof ApiError && thrown.status === 401) {
            router.replace("/");
          } else {
            router.replace("/unavailable");
          }
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void resolveSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-body text-muted">{copy.sources.loading}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardShell user={user} active="sources">
      <SourcesScreen />
    </DashboardShell>
  );
}
