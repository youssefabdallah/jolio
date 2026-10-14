import Link from "next/link";
import { GoogleIcon } from "@/components/icons";
import { googleRedirectUrl } from "@/lib/api/auth";
import { copy } from "@/copy";

/**
 * Provider sign-in entry. A navigation anchor (not a button): the OAuth
 * handshake requires top-level browser navigation to the provider.
 */
export default function GoogleButton() {
  return (
    <Link href={googleRedirectUrl()} className="btn-secondary w-full gap-2.5">
      <GoogleIcon />
      <span>{copy.auth.continueWithGoogle}</span>
    </Link>
  );
}
