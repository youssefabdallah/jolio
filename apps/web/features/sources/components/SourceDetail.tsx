import { copy } from "@/copy";
import type { ApiSource } from "@/lib/api/sources";
import { SOURCE_TYPE_CODE } from "../sourceMeta";

/**
 * Read-only registry detail: every stored field as label/value rows.
 * Rendered inside the shared Modal; the URL is a real link since it
 * comes from the caller's own registry.
 */
export default function SourceDetail({ source }: { source: ApiSource }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: copy.sources.nameLabel, value: source.name },
    {
      label: copy.sources.urlLabel,
      value: (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-primary hover:text-primary-hover break-all"
        >
          {source.url}
        </a>
      ),
    },
    { label: copy.sources.typeLabel, value: SOURCE_TYPE_CODE[source.type] },
    { label: copy.sources.priorityLabel, value: source.priority },
    { label: copy.sources.countryLabel, value: source.country_code },
    {
      label: copy.sources.enabledLabel,
      value: source.is_enabled ? (
        <span className="chip chip-verified">{copy.sources.statusActive}</span>
      ) : (
        <span className="chip chip-neutral">{copy.sources.enabledOff}</span>
      ),
    },
  ];

  return (
    <dl className="src-detail">
      {rows.map((row) => (
        <div key={row.label} className="src-detail-row">
          <dt className="src-detail-term">{row.label}</dt>
          <dd className="src-detail-value">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
