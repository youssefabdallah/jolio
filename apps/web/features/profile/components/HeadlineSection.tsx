"use client";

import { copy } from "@/copy";
import { TextInput } from "@/components/ui";

export interface HeadlineSectionProps {
  headline: string | null;
  summary: string | null;
  errors: Record<string, string>;
  onHeadline: (value: string) => void;
  onSummary: (value: string) => void;
  meta?: string;
}

const HEADLINE_MAX = 140;
/** Mirrors profile.validation summary max (shared/validation/profile.json). */
const SUMMARY_MAX = 2000;

/** Section 2: headline with live counter plus summary. */
export function HeadlineSection({ headline, summary, errors, onHeadline, onSummary, meta }: HeadlineSectionProps) {
  const current = headline ?? "";
  const summaryCount = (summary ?? "").length;
  return (
    <section aria-labelledby="profile-headline" className="space-y-6">
      <div className="card-head-title">
        <div>
          <h2 id="profile-headline" className="text-h2 font-bold text-ink">
            {copy.profile.sectionHeadline}
          </h2>
          <p className="card-desc">{copy.profile.descHeadline}</p>
        </div>
        {meta ? <span className="card-meta-pill">{meta}</span> : null}
      </div>
      <div className="space-y-4">
        <div>
          <TextInput
            id="profile-headline"
            name="headline"
            label={copy.profile.headlineLabel}
            labelAction={
              <span className="font-mono text-caption text-muted" aria-live="polite">
                {current.length} / {HEADLINE_MAX} {copy.profile.headlineCounter}
              </span>
            }
            placeholder={copy.profile.phHeadline}
            value={current}
            maxLength={HEADLINE_MAX}
            error={errors.headline}
            onChange={(event) => onHeadline(event.target.value)}
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-mono text-caption text-muted uppercase" htmlFor="profile-summary">
              {copy.profile.executiveSummaryLabel}
            </label>
            <span className="font-mono text-caption text-muted" aria-live="polite">
              {summaryCount} / {SUMMARY_MAX} {copy.profile.headlineCounter}
            </span>
          </div>
          <textarea
            id="profile-summary"
            name="summary"
            rows={5}
            className="textarea resize-none leading-relaxed"
            placeholder={copy.profile.phSummary}
            aria-describedby={errors.summary ? "profile-summary-error" : undefined}
            aria-invalid={errors.summary ? true : undefined}
            maxLength={SUMMARY_MAX}
            value={summary ?? ""}
            onChange={(event) => onSummary(event.target.value)}
          />
          {errors.summary ? (
            <p id="profile-summary-error" className="field-alert">
              {errors.summary}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
