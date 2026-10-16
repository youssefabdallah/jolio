"use client";

import { SourcesRoute } from "@/features/sources";

/**
 * Sources route: session gate then the Stitch-validated registry.
 * Design preview — rows are static until the API wiring lands.
 */
export default function SourcesPage() {
  return <SourcesRoute />;
}
