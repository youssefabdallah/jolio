import Link from "next/link";
import { copy } from "@/copy";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-auth bg-card rounded-card border border-rule p-8 my-8 text-center">
        <p className="font-mono text-caption text-muted">404</p>
        <h1 className="text-h1 font-bold text-ink mt-2">{copy.common.notFoundTitle}</h1>
        <p className="text-body text-muted mt-2">{copy.common.notFoundBody}</p>
        <Link href="/" className="btn-primary w-full font-bold mt-6">
          {copy.common.backHome}
        </Link>
      </div>
    </main>
  );
}
