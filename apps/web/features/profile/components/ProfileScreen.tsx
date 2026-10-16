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
import { Button, FormError } from "@/components/ui";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArticleIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  EyeIcon,
  GlobeIcon,
  GraduationCapIcon,
  PencilIcon,
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
  ExperienceSection,
  LanguagesSection,
  SkillsSection,
  presentDateErrors,
} from "./Sections";
import StepIndicator, { type WizardStep } from "./StepIndicator";
import { DashboardShell } from "@/components/ui/layout";
import { estimateCompletion } from "../completion";
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

const STEP_TITLES: string[] = [
  copy.profile.stepTitleContact,
  copy.profile.stepTitleHeadline,
  copy.profile.stepTitleSkills,
  copy.profile.stepTitleExperience,
  copy.profile.stepTitleEducation,
  copy.profile.stepTitleLanguages,
  copy.profile.stepTitleReview,
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

/** Skill pill tone for the review step (mockup: expert blue, advanced teal). */
function skillTone(level: string): string {
  const normalized = level.toLowerCase();
  if (normalized === "expert") {
    return "text-primary font-bold";
  }
  if (normalized === "advanced") {
    return "text-teal-deep font-bold";
  }
  return "text-muted font-bold";
}

/** Review-step language level in reference wording (Native, C2 Proficient…). */
function langShort(level: string): string {
  switch (level.toLowerCase()) {
    case "native":
      return copy.profile.langShortNative;
    case "c2":
      return copy.profile.langShortC2;
    case "c1":
      return copy.profile.langShortC1;
    case "b2":
      return copy.profile.langShortB2;
    case "b1":
      return copy.profile.langShortB1;
    case "a2":
      return copy.profile.langShortA2;
    default:
      return copy.profile.langShortA1;
  }
}

/** Skill level with a leading capital (Expert, Advanced…) as in the reference. */
function capLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
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
  const progressTitle = STEP_TITLES[step] ?? "";
  // The percentage mirrors real completeness (weighted), not step
  // position, so it only moves when a field is filled or missing.
  const percentText = copy.profile.percentCompleted.replace("{percent}", String(score));

  function onPreview() {
    if (saving || step === STEPS.length - 1) {
      return;
    }
    void jumpTo(STEPS.length - 1);
  }

  return (
    <DashboardShell user={user} active="profile">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-rule">
        <div>
          <h1 className="text-h1 font-bold text-ink">{copy.profile.title}</h1>
          <p className="text-body text-muted mt-0.5">{copy.profile.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onPreview} disabled={saving}>
            <EyeIcon size={16} />
            {copy.profile.previewResume}
          </Button>
        </div>
      </section>

      <div className="wizard-progress">
        <StepIndicator steps={STEPS} current={step} navigable={score === 100} onSelect={(index) => void jumpTo(index)} />

        <section aria-label={copy.profile.completionLabel} className="pt-1">
        <div className="wizard-progress-meta mb-1.5">
          <span>
            {copy.profile.stepLabel} {step + 1} {copy.profile.ofLabel} {STEPS.length} • {progressTitle}
          </span>
          <span className="wizard-progress-percent">{percentText}</span>
        </div>
        <div
          className="completion-track"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={copy.profile.completionLabel}
        >
          <div className="completion-fill" style={{ width: `${score}%` }} />
        </div>
        </section>
      </div>

      <FormError message={formError} />

      <div className="card">
      <div key={current} className="step-enter profile-scope">
      {current === "contact" ? (
        <ContactSection
          value={input.contact}
          errors={fieldErrors}
          onChange={(contact) => patch({ contact }, "contact")}
          meta={copy.profile.metaPublicRecord}
        />
      ) : null}
      {current === "headline" ? (
        <HeadlineSection
          headline={input.headline ?? null}
          summary={input.summary ?? null}
          errors={fieldErrors}
          onHeadline={(headline) => patch({ headline }, "headline")}
          onSummary={(summary) => patch({ summary }, "summary")}
          meta={copy.profile.metaAtsSync}
        />
      ) : null}
      {current === "skills" ? (
        <SkillsSection
          value={input.skills ?? []}
          errors={fieldErrors}
          expandOnError={hasSectionError("skills")}
          onChange={(skills) => patch({ skills }, "skills")}
          onAdd={() => void requestAdd("skills")}
          meta={copy.profile.metaActiveClusters.replace("{count}", String(input.skills?.length ?? 0))}
        />
      ) : null}
      {current === "experience" ? (
        <ExperienceSection
          value={input.experience ?? []}
          errors={fieldErrors}
          expandOnError={hasSectionError("experience")}
          onChange={(experience) => patch({ experience }, "experience")}
          onAdd={() => void requestAdd("experience")}
          meta={copy.profile.metaPositionsLogged.replace("{count}", String(input.experience?.length ?? 0))}
        />
      ) : null}
      {current === "education" ? (
        <EducationSection
          value={input.education ?? []}
          errors={fieldErrors}
          expandOnError={hasSectionError("education")}
          onChange={(education) => patch({ education }, "education")}
          onAdd={() => void requestAdd("education")}
          meta={copy.profile.metaAcademic}
        />
      ) : null}
      {current === "languages" ? (
        <LanguagesSection
          value={input.languages ?? []}
          errors={fieldErrors}
          expandOnError={hasSectionError("languages")}
          onChange={(languages) => patch({ languages }, "languages")}
          onAdd={() => void requestAdd("languages")}
          meta={copy.profile.metaCefr}
        />
      ) : null}
      {current === "review" ? (
        <section aria-labelledby="profile-review" className="space-y-6">
          <div className="card-head-title">
            <div>
              <h2 id="profile-review" className="text-h2 font-bold text-ink">
                7. {copy.profile.stepTitleReview}
              </h2>
              <p className="card-desc">{copy.profile.descReview}</p>
            </div>
            <span className="card-meta-pill-ready">
              <CheckCircleIcon size={14} />
              <span>{copy.profile.readyToSync}</span>
            </span>
          </div>
          <div className="space-y-4">
            <div className="review-section">
              <div className="review-section-head">
                <div className="flex items-center gap-2">
                  <span className="text-primary" aria-hidden="true">
                    <UserIcon size={18} />
                  </span>
                  <span className="review-section-title">{copy.profile.stepTitleContact}</span>
                </div>
                <button type="button" onClick={() => setStep(0)} className="review-edit">
                  <PencilIcon size={14} />
                  {copy.profile.editSection}
                </button>
              </div>
              {(input.contact.full_name || input.contact.email || input.contact.phone || input.contact.city || input.contact.country || input.contact.website) ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 review-body">
                  <div>
                    <span className="review-label">{copy.profile.reviewNameLabel.toUpperCase()}</span>
                    <span className="font-medium text-ink">{input.contact.full_name || "—"}</span>
                  </div>
                  <div>
                    <span className="review-label">{copy.profile.reviewEmailLabel.toUpperCase()}</span>
                    <span className="font-medium text-ink break-all">{input.contact.email || "—"}</span>
                  </div>
                  <div>
                    <span className="review-label">{copy.profile.phoneLabel.toUpperCase()}</span>
                    <span className="font-medium text-ink">{input.contact.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="review-label">{copy.profile.reviewLocationLabel.toUpperCase()}</span>
                    <span className="font-medium text-ink">
                      {[input.contact.city, input.contact.country].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="review-label">{copy.profile.websiteLabel.toUpperCase()}</span>
                    <span className="font-medium text-primary font-mono break-all">{input.contact.website || "—"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              )}
            </div>
            <div className="review-section">
              <div className="review-section-head">
                <div className="flex items-center gap-2">
                  <span className="text-primary" aria-hidden="true">
                    <ArticleIcon size={18} />
                  </span>
                  <span className="review-section-title">{copy.profile.stepTitleHeadline}</span>
                </div>
                <button type="button" onClick={() => setStep(1)} className="review-edit">
                  <PencilIcon size={14} />
                  {copy.profile.editSection}
                </button>
              </div>
              {input.headline || input.summary ? (
                <div className="space-y-2 review-body">
                  {input.headline ? (
                    <div>
                      <span className="review-label">{copy.profile.headlineLabel.toUpperCase()}</span>
                      <span className="font-medium text-ink">{input.headline}</span>
                    </div>
                  ) : null}
                  {input.summary ? (
                    <div>
                      <span className="review-label">{copy.profile.summaryLabel.toUpperCase()}</span>
                      <p className="text-muted leading-relaxed">{input.summary}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              )}
            </div>
            <div className="review-section">
              <div className="review-section-head">
                <div className="flex items-center gap-2">
                  <span className="text-primary" aria-hidden="true">
                    <TuneIcon size={18} />
                  </span>
                  <span className="review-section-title">
                    {copy.profile.reviewSkillsTitle.replace("{count}", String((input.skills ?? []).length))}
                  </span>
                </div>
                <button type="button" onClick={() => setStep(2)} className="review-edit">
                  <PencilIcon size={14} />
                  {copy.profile.editSection}
                </button>
              </div>
              {(input.skills ?? []).length === 0 ? (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(input.skills ?? []).map((skill, index) => (
                    <span key={index} className="review-pill">
                      {skill.name || skill.group} <span className={skillTone(skill.level)}>• {capLevel(skill.level)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="review-section">
              <div className="review-section-head">
                <div className="flex items-center gap-2">
                  <span className="text-primary" aria-hidden="true">
                    <BriefcaseIcon size={18} />
                  </span>
                  <span className="review-section-title">
                    {copy.profile.reviewWorkTitle.replace("{count}", String((input.experience ?? []).length))}
                  </span>
                </div>
                <button type="button" onClick={() => setStep(3)} className="review-edit">
                  <PencilIcon size={14} />
                  {copy.profile.editSection}
                </button>
              </div>
              {(input.experience ?? []).length === 0 ? (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              ) : (
                <div className="space-y-2 review-body">
                  {(input.experience ?? []).map((entry, index) => (
                    <div key={index} className="flex justify-between items-start gap-3">
                      <div>
                        <span className="font-semibold text-ink">{entry.role}</span>
                        {entry.company ? <span className="text-muted"> — {entry.company}</span> : null}
                      </div>
                      <span className="font-mono text-caption text-muted whitespace-nowrap">
                        {[entry.start_date, entry.end_date ?? copy.profile.presentLabel].filter(Boolean).join(" — ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="review-section">
              <div className="review-section-head">
                <div className="flex items-center gap-2">
                  <span className="text-primary" aria-hidden="true">
                    <GraduationCapIcon size={18} />
                  </span>
                  <span className="review-section-title">{copy.profile.reviewEduTitle}</span>
                </div>
                <button type="button" onClick={() => setStep(4)} className="review-edit">
                  <PencilIcon size={14} />
                  {copy.profile.editSection}
                </button>
              </div>
              {(input.education ?? []).length === 0 ? (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              ) : (
                <div className="space-y-2 review-body">
                  {(input.education ?? []).map((entry, index) => (
                    <div key={index} className="flex justify-between items-start gap-3">
                      <div>
                        <span className="font-semibold text-ink">{entry.degree || "—"}</span>
                        {entry.institution ? <span className="text-muted"> — {entry.institution}</span> : null}
                        {entry.field ? <span className="block text-muted text-[11px]">{entry.field}</span> : null}
                      </div>
                      <span className="font-mono text-caption text-muted whitespace-nowrap">
                        {[entry.start_year, entry.end_year].filter(Boolean).join(" — ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="review-section">
              <div className="review-section-head">
                <div className="flex items-center gap-2">
                  <span className="text-primary" aria-hidden="true">
                    <GlobeIcon size={18} />
                  </span>
                  <span className="review-section-title">{copy.profile.stepTitleLanguages}</span>
                </div>
                <button type="button" onClick={() => setStep(5)} className="review-edit">
                  <PencilIcon size={14} />
                  {copy.profile.editSection}
                </button>
              </div>
              {(input.languages ?? []).length === 0 ? (
                <p className="text-body text-muted">{copy.profile.reviewEmpty}</p>
              ) : (
                <div className="flex flex-wrap gap-3 review-body">
                  {(input.languages ?? []).map((entry, index) => (
                    <span key={index} className="font-mono text-[11px] leading-4">
                      <strong className="text-ink">{entry.language}:</strong> {langShort(entry.level)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}
      </div>

      <div className="wizard-actionbar">
        <p
          className={`wizard-buffered ${saving ? "profile-status-saving" : saved ? "profile-status-saved" : ""}`}
          aria-live="polite"
        >
          <span className={saving ? "text-primary" : "text-teal-600"} aria-hidden="true">
            <CheckCircleIcon size={16} />
          </span>
          <span>{saving ? copy.profile.saving : saved ? copy.profile.saved : copy.profile.bufferedMessage}</span>
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="btn-wizard-outline"
            onClick={onBack}
            disabled={saving || step === 0}
          >
            <ArrowLeftIcon size={16} />
            {copy.profile.back}
          </Button>
          {step < STEPS.length - 1 ? (
            <>
              <Button
                variant="secondary"
                className="btn-wizard-outline"
                onClick={onSaveStay}
                disabled={saving}
              >
                <SaveIcon size={16} />
                {saving ? copy.profile.saving : copy.profile.saveDraft}
              </Button>
              <Button className="btn-wizard" onClick={onNext} disabled={saving}>
                {saving ? copy.profile.saving : copy.profile.next}
                {!saving ? <ArrowRightIcon size={16} /> : null}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                className="btn-wizard-outline"
                onClick={onSaveStay}
                disabled={saving}
              >
                <SaveIcon size={16} />
                {saving ? copy.profile.saving : copy.profile.saveDraft}
              </Button>
              <button type="button" onClick={onSaveAndGo} disabled={saving} className="btn-teal btn-wizard">
                <CheckCircleIcon size={16} />
                {saving ? copy.profile.saving : copy.profile.saveAndGoDashboard}
              </button>
            </>
          )}
        </div>
      </div>
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
