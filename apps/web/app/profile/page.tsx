"use client";

import { ProfileRoute } from "@/features/profile";

/**
 * Profile route: session gate then the Stitch-validated editor.
 * Unknown paths stay protected by the proxy; this page only renders
 * for verified sessions.
 */
export default function ProfilePage() {
  return <ProfileRoute />;
}
