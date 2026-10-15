"use client";

import { useEffect, useState } from "react";
import * as yup from "yup";
import { copy } from "@/copy";
import type { RegisteredUser } from "@/lib/api/auth";
import { me } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  emptyProfileInput,
  getProfile,
  putProfile,
  type CandidateProfile,
  type ProfileExperience,
  type ProfileInput,
} from "@/lib/api/profile";
import { DashboardShell } from "@/components/ui/layout";
import { Button, FormError } from "@/components/ui";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArticleIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  GlobeIcon,
  GraduationCapIcon,
  RefreshIcon,
  SaveIcon,
  TuneIcon,
  UserIcon,
} from "@/components/icons";
import { profileSchema, sectionSchema } from "@/lib/validation/profile";
import { ContactSection } from "./ContactSection";
import { HeadlineSection } from "./HeadlineSection";
import {
  EducationSection,
  ExpandableItem,
  ExperienceSection,
  LanguagesSection,
  SkillsSection,
  presentDateErrors,
} from "./Sections";
import StepIndicator, { type WizardStep } from "./StepIndicator";
import { completionTone, estimateCompletion } from "../completion";
import { useRouter } from "next/navigation";

const STEPS: WizardStep[] = [
  { value: "contact", label: copy.profile.stepContact, icon: UserIcon },
  { value: "headline", label: copy.profile.stepHeadline, icon: ArticleIcon },
  { value: "skills", label: copy.profile.stepSkills, icon: TuneIcon },
  { value: "experience", label: copy.profile.stepExperience, icon: BriefcaseIcon },
  { value: "education", label: copy.profile.stepEducation, icon: GraduationCapIcon },
  { value: "languages", label: copy.profile.stepLanguages, icon: GlobeIcon },
  { value: "review", label: copy.profile.stepReview, icon: CheckCircleIcon },
];

/** Error prefixes belonging to each step (review owns none). */
const STEP_PREFIXES: Record<string, string[]> = {
  contact: ["contact"],
  headline: ["headline", "summary"],
  skills: ["skills"],
  experience: ["experience"],
  education: ["education"],
  languages: ["languages"],
  review: [],
};

/** Document keys sent for each step (review stamps the point only). */
const STEP_FIELDS: Record<string, Array<keyof ProfileInput>> = {
  contact: ["contact"],
  headline: ["headline", "summary"],
  skills: ["skills"],
  experience: ["experience"],
  education: ["education"],
  languages: ["languages"],
  review: [],
};

/** True when any error path belongs to the prefix (bare or nested). */
function matchesPrefix(errors: Record<string, string>, prefix: string): boolean {
  return Object.keys(errors).some((path) => path === prefix || path.startsWith(`${prefix}.`));
}

function toInput(profile: CandidateProfile): ProfileInput {
  return {
    contact: {
      full_name: profile.contact.full_name,
      email: profile.contact.email ?? "",
      phone: profile.contact.phone ?? "",
      city: profile.contact.city ?? "",
      country: profile.contact.country ?? "",
      website: profile.contact.website ?? "",
    },
    headline: profile.headline,
    summary: profile.summary,
    skills: profile.skills.map((s) => ({ ...s })),
    experience: profile.experience.map((e) => ({ ...e, bullets: [...(e.bullets ?? [])] })),
    education: profile.education.map((e) => ({ ...e })),
    languages: profile.languages.map((l) => ({ ...l })),
    current_step: profile.current_step,
  };
}

function stepIndexFor(stored: string | null | undefined): number {
  const found = STEPS.findIndex((step) => step.value === stored);
  return found >= 0 ? found : 0;
}

/** Read-only label/value row for the review step (module level: defining
 *  components during render would reset their state on every render). */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className="text-caption text-muted shrink-0">{label}</dt>
      <dd className="text-body text-ink text-right break-words min-w-0">{value}</dd>
    </div>
  );
}

/**
 * Multi-step profile editor from the validated plan: linear wizard with
 * a step indicator and a live completion bar. Every advance
 * persists the whole document plus the resume point, so the editor
 * always reopens where it left off. Validation runs over the entire
 * document on every save; only the current step blocks progress.
 */
export default function ProfileScreen({
  user,
  initial,
}: {
  user: RegisteredUser;
  initial: ProfileInput | null;
}) {
  const router = useRouter();
  const [input, setInput] = useState<ProfileInput>(initial ?? emptyProfileInput);
  const [step, setStep] = useState<number>(() => stepIndexFor(initial?.current_step));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  /** yup uses bracket paths (skills[0].level); the API uses dots — one form. */
  function toDotPath(path: string | undefined): string {
    return (path ?? "").replace(/\[(\d+)\]/g, ".$1");
  }

  function firstByPath(entries: Array<[string, string[] | string]>): Record<string, string> {
    const mapped: Record<string, string> = {};
    for (const [rawPath, items] of entries) {
      const path = toDotPath(rawPath);
      const message = Array.isArray(items) ? items[0] : items;
      if (path && message && mapped[path] === undefined) {
        mapped[path] = message;
      }
    }
    return mapped;
  }

  /** Drop errors for one section as soon as the user edits it. */
  function clearPrefix(prefix: string) {
    setFieldErrors((current) => {
      const next: Record<string, string> = {};
      for (const [path, message] of Object.entries(current)) {
        if (!path.startsWith(prefix)) {
          next[path] = message;
        }
      }
      return next;
    });
  }

  function patch(patchInput: Partial<ProfileInput>, prefix: string) {
    clearPrefix(prefix);
    setSaved(false);
    setInput({ ...input, ...patchInput });
  }

  /** Sections holding an error render expanded after a save attempt. */
  function hasSectionError(prefix: string): boolean {
    return matchesPrefix(fieldErrors, prefix);
  }

  /** Blank row templates for each repeatable section. */
  function blankRow(section: string): Record<string, unknown> {
    switch (section) {
      case "skills":
        return { group: "", name: "", level: "intermediate" };
      case "experience":
        return { role: "", company: "", start_date: "" };
      case "education":
        return { institution: "", degree: "" };
      default:
        return { language: "", level: "b2" };
    }
  }

  /**
   * Gate for Add buttons: the open rows validate first — incomplete or
   * invalid rows show their errors (and spring open) instead of
   * spawning another blank card.
   */
  async function requestAdd(section: "skills" | "experience" | "education" | "languages"): Promise<void> {
    setSaved(false);
    try {
      await sectionSchema(section).validate({ [section]: input[section] ?? [] }, { abortEarly: false });
    } catch (thrown) {
      if (thrown instanceof yup.ValidationError) {
        const sectionErrors = firstByPath(
          thrown.inner.map((issue) => [issue.path ?? "", issue.message] as [string, string])
        );
        setFieldErrors((current) => {
          const next: Record<string, string> = {};
          for (const [path, message] of Object.entries(current)) {
            if (!path.startsWith(`${section}.`) && !path.startsWith(`${section}[`)) {
              next[path] = message;
            }
          }
          return { ...next, ...sectionErrors };
        });
        return;
      }
      throw thrown;
    }
    if (section === "experience") {
      const presentErrors = presentDateErrors((input.experience ?? []) as ProfileExperience[]);
      if (Object.keys(presentErrors).length > 0) {
        setFieldErrors((current) => ({ ...current, ...presentErrors }));
        return;
      }
    }
    const rows = [...((input[section] ?? []) as unknown[])] as Array<Record<string, unknown>>;
    rows.push(blankRow(section));
    clearPrefix(section);
    setInput({ ...input, [section]: rows });
  }

  async function validateAll(): Promise<{ payload: ProfileInput; errors: Record<string, string> }> {
    try {
      const payload = (await profileSchema().validate(input, { abortEarly: false })) as ProfileInput;
      return { payload, errors: {} };
    } catch (thrown) {
      if (thrown instanceof yup.ValidationError) {
        return {
          payload: input,
          errors: firstByPath(thrown.inner.map((issue) => [issue.path ?? "", issue.message] as [string, string])),
        };
      }
      throw thrown;
    }
  }

  /** Persist a step slice stamped with a resume point. The slice and
   *  the stamp can differ: save-and-go stores the current slice but
   *  resets the resume point to the first step. Silent persists (step
   *  advances) never show the saved banner — only an explicit Save does. */
  async function persist(
    payload: ProfileInput,
    sliceStep: string,
    stampStep?: string,
    opts?: { showSaved?: boolean }
  ): Promise<boolean> {
    const fields = STEP_FIELDS[sliceStep] ?? [];
    const stamp = stampStep ?? sliceStep;
    const slice: Partial<ProfileInput> & { current_step: string } = { current_step: stamp };
    for (const key of fields) {
      (slice as Record<string, unknown>)[key] = payload[key];
    }
    setSaving(true);
    setFormError(null);
    setSaved(false);
    try {
      const result = await putProfile(slice);
      const next = toInput(result.profile);
      setInput(next);
      setFieldErrors({});
      setSaved(opts?.showSaved === true);
      return true;
    } catch (thrown) {
      if (thrown instanceof ApiError) {
        const details = thrown.body.details ?? {};
        const mapped = firstByPath(Object.entries(details));
        setFieldErrors(mapped);
        if (Object.keys(mapped).length === 0) {
          setFormError(thrown.body.message);
        }
      } else {
        setFormError(copy.common.unexpectedError);
      }
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onNext() {
    if (saving || step >= STEPS.length - 1) {
      return;
    }
    const { payload, errors } = await validateAll();
    // Unticked Present with an untouched date picker lives in raw input
    // as "" — check it there, because yup already normalized "" away in
    // the payload above.
    const presentErrors = presentDateErrors(input.experience ?? []);
    const merged = { ...errors, ...presentErrors };
    setFieldErrors(merged);
    // Next behaves like a submit for the current step: any error
    // belonging to it — bare or nested — blocks both the advance and
    // the backend call. The slice sent always matches the validated
    // step, stamped with that same step.
    const currentValue = STEPS[step].value;
    const blocked = (STEP_PREFIXES[currentValue] ?? []).some((prefix) => matchesPrefix(merged, prefix));
    if (blocked) {
      return;
    }
    if (await persist(payload, currentValue, undefined, { showSaved: false })) {
      setStep(step + 1);
    }
  }

  function onBack() {
    if (saving || step <= 0) {
      return;
    }
    setSaved(false);
    setStep(step - 1);
  }

  /** Simple Save for non-review steps: persists the current slice,
   *  stays on the same step, and shows the saved banner. Only the
   *  current step blocks the save (same rule as Next). */
  async function onSaveStay() {
    if (saving) {
      return;
    }
    const { payload, errors } = await validateAll();
    const presentErrors = presentDateErrors(input.experience ?? []);
    const merged = { ...errors, ...presentErrors };
    setFieldErrors(merged);
    const currentValue = STEPS[step].value;
    const blocked = (STEP_PREFIXES[currentValue] ?? []).some((prefix) => matchesPrefix(merged, prefix));
    if (blocked) {
      setSaved(false);
      return;
    }
    await persist(payload, currentValue, currentValue, { showSaved: true });
  }

  async function onSaveAndGo() {
    if (saving) {
      return;
    }
    const { errors } = await validateAll();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Jump to the first step holding an error instead of saving.
      const first = STEPS.find((candidate) =>
        (STEP_PREFIXES[candidate.value] ?? []).some((prefix) => matchesPrefix(errors, prefix))
      );
      if (first) {
        setStep(STEPS.indexOf(first));
      }
      return;
    }
    if (await persist(input, STEPS[step].value, "contact", { showSaved: true })) {
      router.replace("/dashboard");
    }
  }

  /** Jump between steps once the profile is complete: the current
   *  slice saves first (stamped with the destination), so no edit is
   *  lost hopping around. Blocked while the current step has errors. */
  async function jumpTo(target: number) {
    if (saving || target === step || target < 0 || target >= STEPS.length) {
      return;
    }
    const { payload, errors } = await validateAll();
    setFieldErrors(errors);
    const currentValue = STEPS[step].value;
    const blocked = (STEP_PREFIXES[currentValue] ?? []).some((prefix) => matchesPrefix(errors, prefix));
    if (blocked) {
      return;
    }
    if (await persist(payload, currentValue, STEPS[target].value, { showSaved: false })) {
      setStep(target);
    }
  }

  const current = STEPS[step].value;
  const score = estimateCompletion(input);
  const tone = completionTone(score);

  return (
    <DashboardShell user={user} active="profile">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-ink">{copy.profile.title}</h1>
          <p className="text-body text-muted mt-1">{copy.profile.subtitle}</p>
        </div>
      </div>

      <StepIndicator steps={STEPS} current={step} navigable={score === 100} onSelect={(index) => void jumpTo(index)} />

      <section aria-label={copy.profile.completionLabel}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-caption text-muted">{copy.profile.completionLabel}</p>
          <p className="font-mono text-caption text-ink">{score}%</p>
        </div>
        <div
          className="completion-track mt-1"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={copy.profile.completionLabel}
        >
          <div className={`completion-fill-${tone}`} style={{ width: `${score}%` }} />
        </div>
      </section>

      <FormError message={formError} />
      {saved ? <p className="success-alert">{copy.profile.saved}</p> : null}

      <div key={current} className="step-enter">
      {current === "contact" ? (
        <ContactSection
          value={input.contact}
          errors={fieldErrors}
          onChange={(contact) => patch({ contact }, "contact")}
        />
      ) : null}
      {current === "headline" ? (
        <HeadlineSection
          headline={input.headline ?? null}
          summary={input.summary ?? null}
          errors={fieldErrors}
          onHeadline={(headline) => patch({ headline }, "headline")}
          onSummary={(summary) => patch({ summary }, "summary")}
        />
      ) : null}
      {current === "skills" ? (
        <SkillsSection
          value={input.skills ?? []}
          errors={fieldErrors}
          expandOnError={hasSectionError("skills")}
          onChange={(skills) => patch({ skills }, "skills")}
          onAdd={() => void requestAdd("skills")}
        />
      ) : null}
      {current === "experience" ? (
        <ExperienceSection
          value={input.experience ?? []}
          errors={fieldErrors}
          expandOnError={hasSectionError("experience")}
          onChange={(experience) => patch({ experience }, "experience")}
          onAdd={() => void requestAdd("experience")}
        />
      ) : null}
      {current === "education" ? (
        <EducationSection
          value={input.education ?? []}
          errors={fieldErrors}
          expandOnError={hasSectionError("education")}
          onChange={(education) => patch({ education }, "education")}
          onAdd={() => void requestAdd("education")}
        />
      ) : null}
      {current === "languages" ? (
        <LanguagesSection
          value={input.languages ?? []}
          errors={fieldErrors}
          expandOnError={hasSectionError("languages")}
          onChange={(languages) => patch({ languages }, "languages")}
          onAdd={() => void requestAdd("languages")}
        />
      ) : null}
      {current === "review" ? (
        <section className="card" aria-labelledby="profile-review">
          <h2 id="profile-review" className="card-title">
            {copy.profile.reviewTitle}
          </h2>
          <p className="text-body text-muted">{copy.profile.reviewBody}</p>
          <div className="mt-4 form-row">
            <ExpandableItem
              summary={copy.profile.sectionContact}
              index={0}
              section="review"
              defaultOpen={false}
              onEdit={() => setStep(0)}
            >
              <dl>
                <DetailRow label={copy.profile.fullNameLabel} value={input.contact.full_name} />
                {input.contact.email ? (
                  <DetailRow label={copy.profile.emailLabel} value={input.contact.email} />
                ) : null}
                {input.contact.phone ? (
                  <DetailRow label={copy.profile.phoneLabel} value={input.contact.phone} />
                ) : null}
                {input.contact.city ? (
                  <DetailRow label={copy.profile.cityLabel} value={input.contact.city} />
                ) : null}
                {input.contact.country ? (
                  <DetailRow label={copy.profile.countryLabel} value={input.contact.country} />
                ) : null}
                {input.contact.website ? (
                  <DetailRow label={copy.profile.websiteLabel} value={input.contact.website} />
                ) : null}
              </dl>
            </ExpandableItem>

            <ExpandableItem
              summary={copy.profile.sectionHeadline}
              index={1}
              section="review"
              defaultOpen={false}
              onEdit={() => setStep(1)}
            >
              {input.headline ? <p className="text-body font-bold text-ink">{input.headline}</p> : null}
              {input.summary ? <p className="text-body text-muted mt-1">{input.summary}</p> : null}
              {!input.headline && !input.summary ? (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              ) : null}
            </ExpandableItem>

            <ExpandableItem
              summary={copy.profile.sectionSkills}
              meta={String(input.skills?.length ?? 0)}
              index={2}
              section="review"
              defaultOpen={false}
              onEdit={() => setStep(2)}
            >
              {(input.skills ?? []).length === 0 ? (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              ) : (
                <ul>
                  {(input.skills ?? []).map((skill, index) => (
                    <li key={index} className="row-item !px-0">
                      <span className="text-body text-ink">
                        {skill.group} — {skill.name}
                      </span>
                      <span className="ml-auto font-mono text-caption text-muted pl-3">{skill.level}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ExpandableItem>

            <ExpandableItem
              summary={copy.profile.sectionExperience}
              meta={String(input.experience?.length ?? 0)}
              index={3}
              section="review"
              defaultOpen={false}
              onEdit={() => setStep(3)}
            >
              {(input.experience ?? []).length === 0 ? (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              ) : (
                (input.experience ?? []).map((entry, index) => (
                  <article key={index} className={index > 0 ? "border-t border-rule mt-3 pt-3" : undefined}>
                    <p className="text-body font-bold text-ink">
                      {entry.role} · {entry.company}
                    </p>
                    <p className="font-mono text-caption text-muted mt-0.5">
                      {[entry.location, entry.start_date, entry.end_date ?? copy.profile.presentLabel]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {(entry.bullets ?? []).length > 0 ? (
                      <ul className="mt-1.5 list-disc pl-5 text-body text-muted">
                        {(entry.bullets ?? []).map((bullet, bulletIndex) => (
                          <li key={bulletIndex}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))
              )}
            </ExpandableItem>

            <ExpandableItem
              summary={copy.profile.sectionEducation}
              meta={String(input.education?.length ?? 0)}
              index={4}
              section="review"
              defaultOpen={false}
              onEdit={() => setStep(4)}
            >
              {(input.education ?? []).length === 0 ? (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              ) : (
                (input.education ?? []).map((entry, index) => (
                  <article key={index} className={index > 0 ? "border-t border-rule mt-3 pt-3" : undefined}>
                    <p className="text-body font-bold text-ink">
                      {entry.degree}, {entry.institution}
                    </p>
                    <p className="font-mono text-caption text-muted mt-0.5">
                      {[entry.field, entry.start_year, entry.end_year].filter(Boolean).join(" · ")}
                    </p>
                  </article>
                ))
              )}
            </ExpandableItem>

            <ExpandableItem
              summary={copy.profile.sectionLanguages}
              meta={String(input.languages?.length ?? 0)}
              index={5}
              section="review"
              defaultOpen={false}
              onEdit={() => setStep(5)}
            >
              {(input.languages ?? []).length === 0 ? (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              ) : (
                <ul>
                  {(input.languages ?? []).map((entry, index) => (
                    <li key={index} className="row-item !px-0">
                      <span className="text-body text-ink">{entry.language}</span>
                      <span className="ml-auto font-mono text-caption text-muted pl-3">{entry.level}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ExpandableItem>
          </div>
          <div className="pt-4">
            <Button onClick={onSaveAndGo} disabled={saving}>
              <CheckCircleIcon size={16} />
              {saving ? copy.profile.saving : copy.profile.saveAndGoDashboard}
            </Button>
          </div>
        </section>
      ) : null}
      </div>

      <div className="form-actions">
        {step > 0 ? (
          <Button variant="secondary" onClick={onBack} disabled={saving}>
            <ArrowLeftIcon size={16} />
            {copy.profile.back}
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <>
            <Button onClick={onNext} disabled={saving}>
              {saving ? copy.profile.saving : copy.profile.next}
              {!saving ? <ArrowRightIcon size={16} /> : null}
            </Button>
            <Button variant="secondary" onClick={onSaveStay} disabled={saving}>
              <SaveIcon size={16} />
              {saving ? copy.profile.saving : copy.profile.save}
            </Button>
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}

/** Route shell: resolves the session, then the stored profile. */
export function ProfileRoute() {
  const router = useRouter();
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [initial, setInitial] = useState<ProfileInput | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function resolve(): Promise<void> {
      try {
        const session = await me();
        if (!session) {
          if (!cancelled) {
            router.replace("/");
          }
          return;
        }
        // The profile read is best-effort: a transient failure shows an
        // inline retry instead of booting to /unavailable, because the
        // session itself was just proven valid above.
        const profile = await getProfile().catch(() => undefined);
        if (!cancelled) {
          if (profile === undefined) {
            setUser(session.user);
            setLoadError(true);
            return;
          }
          setUser(session.user);
          setInitial(profile ? toInput(profile) : null);
        }
      } catch (thrown) {
        // Only a dead session bounces to sign-in; anything else (a 502
        // outage, 429, or timeout on either call) stays here with a
        // retry, keeping the cookie untouched.
        if (!cancelled) {
          if (thrown instanceof ApiError && thrown.status === 401) {
            router.replace("/");
          } else {
            setLoadError(true);
          }
        }
      }
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [router, retryKey]);

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-4">
        <div className="card max-w-auth text-center">
          <p className="text-body text-ink">{copy.profile.loadFailed}</p>
          <div className="pt-4">
            <Button
              onClick={() => {
                setLoadError(false);
                setRetryKey((k) => k + 1);
              }}
            >
              <RefreshIcon size={16} />
              {copy.common.tryAgain}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (initial === undefined || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-body text-muted">{copy.profile.loading}</p>
      </div>
    );
  }

  return <ProfileScreen user={user} initial={initial} />;
}
