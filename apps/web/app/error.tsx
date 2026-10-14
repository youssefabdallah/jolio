"use client";

import { Button } from "@/components/ui";
import { copy } from "@/copy";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-auth bg-card rounded-card border border-rule p-8 my-8 text-center">
        <h1 className="text-h1 font-bold text-ink">{copy.common.errorTitle}</h1>
        <p className="text-body text-muted mt-2">{copy.common.errorBody}</p>
        <Button className="w-full font-bold mt-6" onClick={() => reset()}>
          {copy.common.tryAgain}
        </Button>
      </div>
    </main>
  );
}
