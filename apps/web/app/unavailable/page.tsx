import Link from "next/link";
import { copy } from "@/copy";

export const metadata = {
  title: "Temporarily unavailable",
};

/**
 * Controlled outage notice. Public route (the proxy passes it through
 * without verification), reached only via rewrite when a protected page
 * cannot verify its session. Never clears the session: a retry after
 * recovery lands the user where they belong.
 */
export default function UnavailablePage() {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-auth bg-card rounded-card border border-rule p-8 my-8 text-center">
        <h1 className="text-h1 font-bold text-ink">{copy.common.unavailableTitle}</h1>
        <p className="text-body text-muted mt-2">{copy.common.unavailableBody}</p>
        <p className="text-body text-muted mt-2">{copy.common.unavailableHint}</p>
        <Link href="/" className="btn-primary w-full font-bold mt-6">
          {copy.common.backHome}
        </Link>
      </div>
    </main>
  );
}
