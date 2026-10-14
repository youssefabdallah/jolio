"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { me } from "@/lib/api/auth";
import type { RegisteredUser } from "@/lib/api/auth";
import { copy } from "@/copy";
import { DashboardScreen } from "@/features/auth";

/**
 * Dashboard shell: resolves the session client-side and renders the
 * minimalist workspace. The proxy already verified the session before
 * this page is served; a 401 here (revoked since) bounces to login.
 */
export default function DashboardPage() {
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
      } catch {
        if (!cancelled) {
          router.replace("/");
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
        <p className="text-body text-muted">{copy.dashboard.loading}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <DashboardScreen user={user} />;
}
