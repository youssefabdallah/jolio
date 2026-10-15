"use client";

import { useState } from "react";
import { copy } from "@/copy";
import { Button, IconButton, TextInput } from "@/components/ui";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/inputs/Autocomplete";
import { ChevronDownIcon, PencilIcon, PlusIcon } from "@/components/icons";
import RichBullets from "./RichBullets";
import taxonomy from "../data/skills-taxonomy.json";
import type { ProfileEducation, ProfileExperience, ProfileLanguage, ProfileSkill } from "@/lib/api/profile";

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
const LANGUAGE_LEVELS = ["a1", "a2", "b1", "b2", "c1", "c2", "native"] as const;

const SKILL_LABELS: Record<string, string> = {
  beginner: copy.profile.skillBeginner,
  intermediate: copy.profile.skillIntermediate,
  advanced: copy.profile.skillAdvanced,
  expert: copy.profile.skillExpert,
};

function languageLabel(level: string): string {
  return level === "native" ? copy.profile.langNative : level.toUpperCase();
}

/** Year options for education selects, from the domain floor to the rolling cap. */
const MIN_YEAR = 1950;
let cachedYears: number[] | null = null;
function yearOptions(): number[] {
  if (!cachedYears) {
    const max = new Date().getFullYear() + 5;
    cachedYears = [];
    for (let year = max; year >= MIN_YEAR; year--) {
      cachedYears.push(year);
    }
  }
  return cachedYears;
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton aria-label={copy.profile.removeRow} onClick={onClick}>
      <span aria-hidden="true">×</span>
    </IconButton>
  );
}

/**
 * One collapsible entry card for repeatable sections. The header shows
 * a one-line summary; the body holds the fields. New entries mount
 * expanded so the user lands straight in the form. onRemove is
 * optional: read-only uses (review) omit it and the card has no action.
 */
export function ExpandableItem({
  summary,
  meta,
  defaultOpen,
  forceOpen,
  onRemove,
  onEdit,
  children,
  index,
  section,
}: {
  summary: string;
  meta?: string | null;
  defaultOpen: boolean;
  forceOpen?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
  children: React.ReactNode;
  index: number;
  section: string;
}) {
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  // Mount default, captured once: the defaultOpen prop flips as the user
  // types (empty vs filled), which must never collapse the card.
  const [initialOpen] = useState(defaultOpen);
  const bodyId = `${section}-item-${index}`;
  // Derived, never synced in an effect: a failed save forces
  // error-holding cards open (even ones the user collapsed) so no
  // message hides inside a collapsed section; otherwise an explicit
  // user toggle wins, falling back to the mount default.
  const open = forceOpen === true ? true : (manualOpen ?? initialOpen);
  return (
    <article className="border border-rule rounded-control">
      <div className="flex items-center gap-2 px-4 h-11">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setManualOpen(!open)}
          className="flex-1 min-w-0 flex items-center gap-2 text-left"
        >
          <span
            aria-hidden="true"
            className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <ChevronDownIcon size={16} />
          </span>
          <span className="text-body font-bold text-ink truncate">{summary}</span>
          {meta ? <span className="font-mono text-caption text-muted truncate">{meta}</span> : null}
        </button>
        {onRemove ? <RemoveButton onClick={onRemove} /> : null}
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 inline-flex items-center gap-1 text-body text-primary font-medium hover:underline"
          >
            <PencilIcon size={14} />
            {copy.profile.editSection}
          </button>
        ) : null}
      </div>
      {open ? (
        <div id={bodyId} className="border-t border-rule p-4 form-row">
          {children}
        </div>
      ) : null}
    </article>
  );
}

/** Curated IT group/skill pool: suggest-only, so custom text still saves. */
const GROUP_OPTIONS: AutocompleteOption[] = taxonomy.groups.map((group) => ({
  value: group.name,
  label: group.name,
}));

/** Skill pool scoped to the picked group, or every skill with its group as context. */
function skillOptionsFor(group: string): AutocompleteOption[] {
  const picked = taxonomy.groups.find((entry) => entry.name === group);
  if (picked) {
    return picked.skills.map((skill) => ({ value: skill, label: skill, hint: picked.name }));
  }
  return taxonomy.groups.flatMap((entry) =>
    entry.skills.map((skill) => ({ value: skill, label: skill, hint: entry.name }))
  );
}

/** Section 3: skills matrix with level dropdowns. */
export function SkillsSection({
  value,
  errors,
  expandOnError,
  onChange,
  onAdd,
}: {
  value: ProfileSkill[];
  errors: Record<string, string>;
  expandOnError: boolean;
  onChange: (value: ProfileSkill[]) => void;
  onAdd: () => void;
}) {
  return (
    <section className="card" aria-labelledby="profile-skills">
      <h2 id="profile-skills" className="card-title">
        {copy.profile.sectionSkills}
      </h2>
      {errors.skills ? <p className="field-alert mb-4">{errors.skills}</p> : null}
      <div className="form-row">
        {value.map((skill, index) => (
          <ExpandableItem
            key={index}
            index={index}
            section="skill"
            forceOpen={expandOnError}
            defaultOpen={skill.group === "" && skill.name === ""}
            summary={skill.name || skill.group || `${copy.profile.skillLabel} ${index + 1}`}
            meta={SKILL_LABELS[skill.level] ?? skill.level}
            onRemove={() => onChange(value.filter((_, i) => i !== index))}
          >
            <div className="form-row-3 items-end">
              <Autocomplete
                id={`skill-group-${index}`}
                label={copy.profile.groupLabel}
                value={skill.group}
                options={GROUP_OPTIONS}
                onChange={(group) =>
                  onChange(value.map((s, i) => (i === index ? { ...s, group } : s)))
                }
                placeholder={copy.profile.phGroup}
                name={`skills[${index}].group`}
                error={errors[`skills.${index}.group`]}
                emptyText={copy.profile.autocompleteKeepCustom}
              />
              <Autocomplete
                id={`skill-name-${index}`}
                label={copy.profile.skillLabel}
                value={skill.name}
                options={skillOptionsFor(skill.group)}
                onChange={(name) =>
                  onChange(value.map((s, i) => (i === index ? { ...s, name } : s)))
                }
                placeholder={copy.profile.phSkill}
                name={`skills[${index}].name`}
                error={errors[`skills.${index}.name`]}
                emptyText={copy.profile.autocompleteKeepCustom}
              />
              <div>
                <label className="label" htmlFor={`skill-level-${index}`}>
                  {copy.profile.levelLabel}
                </label>
                <select
                  id={`skill-level-${index}`}
                  className="select"
                  aria-describedby={errors[`skills.${index}.level`] ? `skill-level-${index}-error` : undefined}
                  aria-invalid={errors[`skills.${index}.level`] ? true : undefined}
                  value={skill.level}
                  onChange={(event) =>
                    onChange(value.map((s, i) => (i === index ? { ...s, level: event.target.value } : s)))
                  }
                >
                  {SKILL_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {SKILL_LABELS[level]}
                    </option>
                  ))}
                </select>
                {errors[`skills.${index}.level`] ? (
                  <p id={`skill-level-${index}-error`} className="field-alert">
                    {errors[`skills.${index}.level`]}
                  </p>
                ) : null}
              </div>
            </div>
          </ExpandableItem>
        ))}
      </div>
      <div className="pt-4">
        <Button variant="secondary" onClick={onAdd}>
          <PlusIcon size={16} />
          {copy.profile.addSkill}
        </Button>
      </div>
    </section>
  );
}

/** Unticked Present with no end date is not a state — flag it. */
export function presentDateErrors(experience: ProfileExperience[]): Record<string, string> {
  const errors: Record<string, string> = {};
  experience.forEach((entry, index) => {
    if (entry.end_date === "") {
      errors[`experience.${index}.end_date`] = copy.profile.endDateRequired;
    }
  });
  return errors;
}

/** Section 4: work experience entries. */
export function ExperienceSection({
  value,
  errors,
  expandOnError,
  onChange,
  onAdd,
}: {
  value: ProfileExperience[];
  errors: Record<string, string>;
  expandOnError: boolean;
  onChange: (value: ProfileExperience[]) => void;
  onAdd: () => void;
}) {
  return (
    <section className="card" aria-labelledby="profile-experience">
      <h2 id="profile-experience" className="card-title">
        {copy.profile.sectionExperience}
      </h2>
      {errors.experience ? <p className="field-alert mb-4">{errors.experience}</p> : null}
      <div className="form-row">
        {value.map((entry, index) => {
          const set = (patch: Partial<ProfileExperience>) =>
            onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
          // Present means null/undefined — never "" : unchecking lands on
          // "" (must pick), which is falsy but must NOT snap back to
          // checked, or the checkbox locks and the picker stays shut.
          const present = entry.end_date == null;
          const dates = entry.start_date
            ? `${entry.start_date} → ${entry.end_date ?? copy.profile.presentLabel}`
            : null;
          // Array-level errors land on the key itself; per-bullet errors
          // (experience.i.bullets.j) surface on the shared textarea.
          const bulletsError =
            errors[`experience.${index}.bullets`] ??
            Object.entries(errors).find(([key]) => key.startsWith(`experience.${index}.bullets.`))?.[1];
          return (
            <ExpandableItem
              key={index}
              index={index}
              section="exp"
              forceOpen={expandOnError}
              defaultOpen={entry.role === "" && entry.company === ""}
              summary={
                entry.role && entry.company
                  ? `${entry.role} · ${entry.company}`
                  : `${copy.profile.roleLabel} ${index + 1}`
              }
              meta={dates}
              onRemove={() => onChange(value.filter((_, i) => i !== index))}
            >
              <div className="form-row-3">
                <TextInput
                  id={`exp-role-${index}`}
                  name={`experience[${index}].role`}
                  label={copy.profile.roleLabel}
                  placeholder={copy.profile.phRole}
                  value={entry.role}
                  error={errors[`experience.${index}.role`]}
                  onChange={(event) => set({ role: event.target.value })}
                />
                <TextInput
                  id={`exp-company-${index}`}
                  name={`experience[${index}].company`}
                  label={copy.profile.companyLabel}
                  placeholder={copy.profile.phCompany}
                  value={entry.company}
                  error={errors[`experience.${index}.company`]}
                  onChange={(event) => set({ company: event.target.value })}
                />
                <TextInput
                  id={`exp-location-${index}`}
                  name={`experience[${index}].location`}
                  label={copy.profile.locationLabel}
                  placeholder={copy.profile.phLocation}
                  value={entry.location ?? ""}
                  error={errors[`experience.${index}.location`]}
                  onChange={(event) => set({ location: event.target.value })}
                />
              </div>
              <div className="form-row-3">
                <TextInput
                  id={`exp-start-${index}`}
                  name={`experience[${index}].start_date`}
                  type="month"
                  label={copy.profile.startDateLabel}
                  value={entry.start_date}
                  error={errors[`experience.${index}.start_date`]}
                  onChange={(event) => set({ start_date: event.target.value })}
                />
                <TextInput
                  id={`exp-end-${index}`}
                  name={`experience[${index}].end_date`}
                  type="month"
                  label={copy.profile.endDateLabel}
                  value={entry.end_date ?? ""}
                  disabled={present}
                  error={errors[`experience.${index}.end_date`]}
                  onChange={(event) => set({ end_date: event.target.value })}
                />
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-body">
                    <input
                      type="checkbox"
                      checked={present}
                      onChange={(event) => set({ end_date: event.target.checked ? null : "" })}
                    />
                    {copy.profile.presentLabel}
                  </label>
                </div>
              </div>
              <div>
                <span className="label" id={`exp-bullets-${index}-label`}>
                  {copy.profile.bulletsLabel}
                </span>
                <RichBullets
                  id={`exp-bullets-${index}`}
                  value={entry.bullets ?? []}
                  describedBy={bulletsError ? `exp-bullets-${index}-error` : `exp-bullets-${index}-label`}
                  invalid={Boolean(bulletsError)}
                  onChange={(bullets) => set({ bullets })}
                />
                {bulletsError ? (
                  <p id={`exp-bullets-${index}-error`} className="field-alert">
                    {bulletsError}
                  </p>
                ) : null}
              </div>
            </ExpandableItem>
          );
        })}
      </div>
      <div className="pt-4">
        <Button variant="secondary" onClick={onAdd}>
          <PlusIcon size={16} />
          {copy.profile.addRole}
        </Button>
      </div>
    </section>
  );
}

/** Section 5: education entries. */
export function EducationSection({
  value,
  errors,
  expandOnError,
  onChange,
  onAdd,
}: {
  value: ProfileEducation[];
  errors: Record<string, string>;
  expandOnError: boolean;
  onChange: (value: ProfileEducation[]) => void;
  onAdd: () => void;
}) {
  return (
    <section className="card" aria-labelledby="profile-education">
      <h2 id="profile-education" className="card-title">
        {copy.profile.sectionEducation}
      </h2>
      {errors.education ? <p className="field-alert mb-4">{errors.education}</p> : null}
      <div className="form-row">
        {value.map((entry, index) => {
          const set = (patch: Partial<ProfileEducation>) =>
            onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
          const years =
            entry.start_year || entry.end_year
              ? `${entry.start_year ?? ""} → ${entry.end_year ?? copy.profile.presentLabel}`
              : null;
          return (
            <ExpandableItem
              key={index}
              index={index}
              section="edu"
              forceOpen={expandOnError}
              defaultOpen={entry.institution === "" && entry.degree === ""}
              summary={
                entry.degree && entry.institution
                  ? `${entry.degree}, ${entry.institution}`
                  : `${copy.profile.degreeLabel} ${index + 1}`
              }
              meta={years}
              onRemove={() => onChange(value.filter((_, i) => i !== index))}
            >
              <div className="form-row-3">
                <TextInput
                  id={`edu-institution-${index}`}
                  name={`education[${index}].institution`}
                  label={copy.profile.institutionLabel}
                  placeholder={copy.profile.phInstitution}
                  value={entry.institution}
                  error={errors[`education.${index}.institution`]}
                  onChange={(event) => set({ institution: event.target.value })}
                />
                <TextInput
                  id={`edu-degree-${index}`}
                  name={`education[${index}].degree`}
                  label={copy.profile.degreeLabel}
                  placeholder={copy.profile.phDegree}
                  value={entry.degree}
                  error={errors[`education.${index}.degree`]}
                  onChange={(event) => set({ degree: event.target.value })}
                />
                <TextInput
                  id={`edu-field-${index}`}
                  name={`education[${index}].field`}
                  label={copy.profile.fieldLabel}
                  placeholder={copy.profile.phField}
                  value={entry.field ?? ""}
                  error={errors[`education.${index}.field`]}
                  onChange={(event) => set({ field: event.target.value })}
                />
              </div>
              <div className="form-row-3">
                <div>
                  <label className="label" htmlFor={`edu-start-${index}`}>
                    {copy.profile.startYearLabel}
                  </label>
                  <select
                    id={`edu-start-${index}`}
                    className="select"
                    aria-describedby={errors[`education.${index}.start_year`] ? `edu-start-${index}-error` : undefined}
                    aria-invalid={errors[`education.${index}.start_year`] ? true : undefined}
                    value={entry.start_year ?? ""}
                    onChange={(event) =>
                      set({ start_year: event.target.value === "" ? null : Number(event.target.value) })
                    }
                  >
                    <option value="">—</option>
                    {yearOptions().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors[`education.${index}.start_year`] ? (
                    <p id={`edu-start-${index}-error`} className="field-alert">
                      {errors[`education.${index}.start_year`]}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="label" htmlFor={`edu-end-${index}`}>
                    {copy.profile.endYearLabel}
                  </label>
                  <select
                    id={`edu-end-${index}`}
                    className="select"
                    aria-describedby={errors[`education.${index}.end_year`] ? `edu-end-${index}-error` : undefined}
                    aria-invalid={errors[`education.${index}.end_year`] ? true : undefined}
                    value={entry.end_year ?? ""}
                    onChange={(event) =>
                      set({ end_year: event.target.value === "" ? null : Number(event.target.value) })
                    }
                  >
                    <option value="">—</option>
                    {yearOptions().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors[`education.${index}.end_year`] ? (
                    <p id={`edu-end-${index}-error`} className="field-alert">
                      {errors[`education.${index}.end_year`]}
                    </p>
                  ) : null}
                </div>
              </div>
            </ExpandableItem>
          );
        })}
      </div>
      <div className="pt-4">
        <Button variant="secondary" onClick={onAdd}>
          <PlusIcon size={16} />
          {copy.profile.addEducation}
        </Button>
      </div>
    </section>
  );
}

/** Section 6: languages with CEFR levels. */
export function LanguagesSection({
  value,
  errors,
  expandOnError,
  onChange,
  onAdd,
}: {
  value: ProfileLanguage[];
  errors: Record<string, string>;
  expandOnError: boolean;
  onChange: (value: ProfileLanguage[]) => void;
  onAdd: () => void;
}) {
  return (
    <section className="card" aria-labelledby="profile-languages">
      <h2 id="profile-languages" className="card-title">
        {copy.profile.sectionLanguages}
      </h2>
      {errors.languages ? <p className="field-alert mb-4">{errors.languages}</p> : null}
      <div className="form-row">
        {value.map((entry, index) => (
          <ExpandableItem
            key={index}
            index={index}
            section="lang"
              forceOpen={expandOnError}
            defaultOpen={entry.language === ""}
            summary={entry.language || `${copy.profile.languageLabel} ${index + 1}`}
            meta={languageLabel(entry.level)}
            onRemove={() => onChange(value.filter((_, i) => i !== index))}
          >
            <div className="form-row-3">
              <TextInput
                id={`lang-name-${index}`}
                name={`languages[${index}].language`}
                label={copy.profile.languageLabel}
                placeholder={copy.profile.phLanguage}
                value={entry.language}
                error={errors[`languages.${index}.language`]}
                onChange={(event) =>
                  onChange(value.map((l, i) => (i === index ? { ...l, language: event.target.value } : l)))
                }
              />
              <div>
                <label className="label" htmlFor={`lang-level-${index}`}>
                  {copy.profile.levelLabel}
                </label>
                <select
                  id={`lang-level-${index}`}
                  className="select"
                  aria-describedby={errors[`languages.${index}.level`] ? `lang-level-${index}-error` : undefined}
                  aria-invalid={errors[`languages.${index}.level`] ? true : undefined}
                  value={entry.level}
                  onChange={(event) =>
                    onChange(value.map((l, i) => (i === index ? { ...l, level: event.target.value } : l)))
                  }
                >
                  {LANGUAGE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {languageLabel(level)}
                    </option>
                  ))}
                </select>
                {errors[`languages.${index}.level`] ? (
                  <p id={`lang-level-${index}-error`} className="field-alert">
                    {errors[`languages.${index}.level`]}
                  </p>
                ) : null}
              </div>
            </div>
          </ExpandableItem>
        ))}
      </div>
      <div className="pt-4">
        <Button variant="secondary" onClick={onAdd}>
          <PlusIcon size={16} />
          {copy.profile.addLanguage}
        </Button>
      </div>
    </section>
  );
}
