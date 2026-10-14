"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { RegisteredUser } from "@/lib/api/auth";
import { logout } from "@/lib/api/auth";
import { copy } from "@/copy";

export interface SignedInCardProps {
  user: RegisteredUser;
  onSignOut: () => void;
}

/**
 * Authenticated state: who is signed in, with a sign-out that revokes
 * server-side before falling back to the form.
 */
export default function SignedInCard({ user, onSignOut }: SignedInCardProps) {
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOutClick() {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await logout();
    } finally {
      onSignOut();
    }
  }

  return (
    <div className="w-full max-w-auth bg-card rounded-card border border-rule p-8 my-8 text-center">
      <div className="w-12 h-12 mx-auto bg-ink rounded-full flex items-center justify-center text-paper font-mono text-h2 font-bold">
        {user.display_name.slice(0, 1).toUpperCase()}
      </div>
      <h1 className="text-h2 font-bold text-ink mt-4">{user.display_name}</h1>
      <p className="text-body text-muted mt-1">{user.email}</p>
      <div className="pt-6">
        <Button
          variant="secondary"
          className="w-full font-bold"
          disabled={signingOut}
          onClick={onSignOutClick}
        >
          {signingOut ? copy.auth.signingOut : copy.auth.signOut}
        </Button>
      </div>
    </div>
  );
}
