"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { exchangeOAuthToken } from "@/lib/api/auth";
import { isSafeNextPath } from "@/lib/auth/routes";
import { copy } from "@/copy";

/**
 * OAuth landing page. The token — or a failure code the backend redirects
 * back with — arrives in the URL fragment, which never reaches the server,
 * so this boundary must run in the browser. Each failure maps to its own
 * message so users can tell an expired link from a dead backend: only a
 * genuinely invalid token blames the link.
 */
export default function OAuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    /** Remove the fragment so the token never lingers in history. */
    function clearFragment(): void {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    function fail(text: string): void {
      if (!cancelled) {
        setMessage(text);
      }
    }

    async function completeHandshake(): Promise<void> {
      const params = new URLSearchParams(window.location.hash.slice(1));
      // Wipe the fragment immediately after reading: history entries,
      // shoulder-surfers, and extensions must not retain the token.
      clearFragment();

      const failed = params.get("error");
      if (failed) {
        fail(failed === "EMAIL_TAKEN" ? copy.auth.emailExistsLogin : copy.auth.oauthInvalid);
        return;
      }

      const token = params.get("token");
      if (!token) {
        fail(copy.auth.oauthInvalid);
        return;
      }

      try {
        await exchangeOAuthToken(token);
      } catch (thrown) {
        // A dead backend is an outage, not an expired link — say so.
        if (thrown instanceof ApiError && (thrown.status === 0 || thrown.status === 502)) {
          fail(copy.common.failedConnection);
        } else {
          fail(copy.auth.oauthInvalid);
        }
        return;
      }

      if (!cancelled) {
        // Same validated ?next= return as password flows. Note: the
        // backend handshake redirect drops the query string today, so
        // OAuth logins land on the dashboard until it preserves it.
        const next = new URLSearchParams(window.location.search).get("next");
        router.replace(isSafeNextPath(next) ? next : "/dashboard");
      }
    }

    void completeHandshake();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="w-full max-w-auth bg-card rounded-card border border-rule p-8 my-8 text-center">
      {message ? (
        <>
          <p role="alert" className="text-body text-danger-deep">
            {message}
          </p>
          <p className="text-body text-muted mt-4">
            <Link href="/" className="text-primary font-medium hover:underline">
              {copy.common.backHome}
            </Link>
          </p>
        </>
      ) : (
        <p className="text-body text-muted">{copy.auth.oauthExchanging}</p>
      )}
    </div>
  );
}
