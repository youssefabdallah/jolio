"use client";

import { copy } from "@/copy";
import { TextInput } from "@/components/ui";

export interface HeadlineSectionProps {
  headline: string | null;
  summary: string | null;
  errors: Record<string, string>;
  onHeadline: (value: string) => void;
  onSummary: (value: string) => void;
}

const HEADLINE_MAX = 140;

/** Section 2: headline with live counter plus summary. */
export function HeadlineSection({ headline, summary, errors, onHeadline, onSummary }: HeadlineSectionProps) {
  const current = headline ?? "";
  return (
    <section className="card" aria-labelledby="profile-headline">
      <h2 id="profile-headline" className="card-title">
        {copy.profile.sectionHeadline}
      </h2>
      <div className="form-row">
        <div>
          <TextInput
            id="profile-headline"
            name="headline"
            label={copy.profile.headlineLabel}
            placeholder={copy.profile.phHeadline}
            value={current}
            maxLength={HEADLINE_MAX}
            error={errors.headline}
            onChange={(event) => onHeadline(event.target.value)}
          />
          <p className="text-caption text-muted mt-1 font-mono" aria-live="polite">
            {current.length} / {HEADLINE_MAX} {copy.profile.headlineCounter}
          </p>
        </div>
        <div>
          <label className="label" htmlFor="profile-summary">
            {copy.profile.summaryLabel}
          </label>
          <textarea
            id="profile-summary"
            name="summary"
            rows={4}
            className="textarea"
            placeholder={copy.profile.phSummary}
            aria-describedby={errors.summary ? "profile-summary-error" : undefined}
            aria-invalid={errors.summary ? true : undefined}
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
