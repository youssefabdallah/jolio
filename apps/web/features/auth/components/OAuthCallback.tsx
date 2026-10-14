"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { exchangeOAuthToken } from "@/lib/api/auth";
import { isSafeNextPath } from "@/lib/auth/routes";
import { copy } from "@/copy";

/**
 * OAuth landing page. The token — or a failure code the backend redirects
 * back with — arrives in the URL fragment, which never reaches the server,
 * so this boundary must run in the browser. Codes map to copy.ts messages;
 * the token goes straight to the exchange proxy.
 */
export default function OAuthCallback() {
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function completeHandshake(): Promise<void> {
      const params = new URLSearchParams(window.location.hash.slice(1));

      const failed = params.get("error");
      if (failed) {
        if (!cancelled) {
          setErrorCode(failed);
        }
        return;
      }

      const token = params.get("token");
      if (!token) {
        if (!cancelled) {
          setErrorCode("UNKNOWN");
        }
        return;
      }

      try {
        await exchangeOAuthToken(token);
      } catch {
        if (!cancelled) {
          setErrorCode("UNKNOWN");
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
      {errorCode ? (
        <>
          <p role="alert" className="text-body text-danger-deep">
            {errorCode === "EMAIL_TAKEN" ? copy.auth.emailExistsLogin : copy.auth.oauthInvalid}
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
