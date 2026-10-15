"use client";

import { useState } from "react";
import { copy } from "@/copy";
import { Button, TextInput } from "@/components/ui";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/inputs/Autocomplete";
import { ChevronDownIcon, CloseIcon, PencilIcon, PlusIcon, SearchIcon } from "@/components/icons";
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

function languageBadge(level: string): string {
  switch (level) {
    case "native":
      return copy.profile.langBadgeNative;
    case "c2":
      return copy.profile.langBadgeC2;
    case "c1":
      return copy.profile.langBadgeC1;
    case "b2":
      return copy.profile.langBadgeB2;
    case "b1":
      return copy.profile.langBadgeB1;
    case "a2":
      return copy.profile.langBadgeA2;
    default:
      return copy.profile.langBadgeA1;
  }
}

/** Display-only two-letter code: ISO 639-1 for known languages. */
const LANG_ISO: Record<string, string> = {
  german: "DE",
  english: "EN",
  spanish: "ES",
  french: "FR",
  italian: "IT",
  portuguese: "PT",
  dutch: "NL",
  polish: "PL",
  arabic: "AR",
  hindi: "HI",
  chinese: "ZH",
  mandarin: "ZH",
  japanese: "JA",
  korean: "KO",
  russian: "RU",
  turkish: "TR",
  ukrainian: "UK",
  swedish: "SV",
  norwegian: "NO",
  danish: "DA",
  finnish: "FI",
  greek: "EL",
  hebrew: "HE",
  czech: "CS",
  romanian: "RO",
  hungarian: "HU",
};
function langCode(name: string): string {
  const iso = LANG_ISO[name.trim().toLowerCase()];
  if (iso) {
    return iso;
  }
  const cleaned = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  return (cleaned.slice(0, 2) || "••").padEnd(2, "•");
}

/** Education years are plain four-digit fields in the reference. The
 *  stored value stays an integer (or null) so the shared schema still
 *  enforces the 1950…current+5 range. */
function parseYear(raw: string): number | null {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits === "" ? null : Number(digits);
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={copy.profile.removeRow}
      onClick={onClick}
      className="row-remove"
    >
      <CloseIcon size={16} />
    </button>
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

/** Section 3: skills matrix with the mockup toolbar (group + skill + level + Add). */
export function SkillsSection({
  value,
  errors,
  expandOnError,
  onChange,
  onAdd,
  meta,
}: {
  value: ProfileSkill[];
  errors: Record<string, string>;
  expandOnError: boolean;
  onChange: (value: ProfileSkill[]) => void;
  onAdd: () => void;
  meta?: string;
}) {
  void expandOnError;
  const [toolbarGroup, setToolbarGroup] = useState("");
  const [toolbarName, setToolbarName] = useState("");
  const [toolbarLevel, setToolbarLevel] = useState<string>("expert");
  function toolbarAdd() {
    if (toolbarGroup.trim() === "" && toolbarName.trim() === "") {
      onAdd();
      return;
    }
    onChange([...value, { group: toolbarGroup, name: toolbarName, level: toolbarLevel }]);
    setToolbarGroup("");
    setToolbarName("");
  }
  return (
    <section aria-labelledby="profile-skills" className="space-y-6">
      <div className="card-head-title">
        <div>
          <h2 id="profile-skills" className="text-h2 font-bold text-ink">
            {copy.profile.sectionSkills}
          </h2>
          <p className="card-desc">{copy.profile.descSkills}</p>
        </div>
        {meta ? <span className="card-meta-pill">{meta}</span> : null}
      </div>
      {errors.skills ? <p className="field-alert">{errors.skills}</p> : null}
      <div className="skill-toolbar">
        <div className="skill-toolbar-title">{copy.profile.toolbarAddSkill}</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4">
            <Autocomplete
              id="skill-toolbar-group"
              label={copy.profile.toolbarGroupLabel}
              value={toolbarGroup}
              options={GROUP_OPTIONS}
              onChange={setToolbarGroup}
              placeholder={copy.profile.phGroup}
              name="toolbar-group"
              trailing={<ChevronDownIcon size={16} />}
              emptyText={copy.profile.autocompleteKeepCustom}
            />
          </div>
          <div className="md:col-span-5">
            <Autocomplete
              id="skill-toolbar-name"
              label={copy.profile.toolbarSkillLabel}
              value={toolbarName}
              options={skillOptionsFor(toolbarGroup)}
              onChange={setToolbarName}
              placeholder={copy.profile.phSkill}
              name="toolbar-skill"
              trailing={<SearchIcon size={16} />}
              emptyText={copy.profile.autocompleteKeepCustom}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="skill-toolbar-level">
              {copy.profile.toolbarLevelLabel}
            </label>
            {/* One chevron only: `.select-arrow` paints it; no extra icon. */}
            <select
              id="skill-toolbar-level"
              className="select select-arrow pl-2.5 pr-8"
              value={toolbarLevel}
              onChange={(event) => setToolbarLevel(event.target.value)}
            >
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {SKILL_LABELS[level]}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1 pt-4">
            <Button
              onClick={toolbarAdd}
              className="w-full gap-1 px-2 text-caption"
              aria-label={copy.profile.addSkill}
            >
              {/* White label/icon (btn-primary); keep the glyph from
                  flex-shrinking to 0 in the narrow 1/12 column. */}
              <PlusIcon size={16} className="shrink-0" />
              {copy.profile.addShort}
            </Button>
          </div>
        </div>
      </div>
      <div className="skills-table">
      <div className="skills-head" aria-hidden="true">
        <span>{copy.profile.colGroup}</span>
        <span>{copy.profile.colSkill}</span>
        <span>{copy.profile.colLevel}</span>
        <span />
      </div>
      <div className="skills-body">
        {value.map((skill, index) => (
          <div key={index} className="skills-row inline-row">
            <div className="cell-mono">
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
            </div>
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
              <label className="sr-only" htmlFor={`skill-level-${index}`}>
                {copy.profile.levelLabel}
              </label>
              <select
                id={`skill-level-${index}`}
                className="select-sm select-arrow"
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
            <div className="skills-row-remove">
              <RemoveButton onClick={() => onChange(value.filter((_, i) => i !== index))} />
            </div>
          </div>
        ))}
      </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <span className="skills-hint">{copy.profile.skillsHint}</span>
      </div>
    </section>
  );
}

/** Plain-textarea bullets: stored sentences render with a bullet
 *  prefix per line; edits strip markers and drop blank lines. */
function bulletsToText(bullets: string[]): string {
  return bullets.map((line) => (/^\s*[\u2022\-\*]\s?/.test(line) ? line : `\u2022 ${line}`)).join("\n");
}
function textToBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*[\u2022\-\*]\s?/, "").trim())
    .filter((line) => line !== "");
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
  meta,
}: {
  value: ProfileExperience[];
  errors: Record<string, string>;
  expandOnError: boolean;
  onChange: (value: ProfileExperience[]) => void;
  onAdd: () => void;
  meta?: string;
}) {
  // Entries are always expanded (reference design), so error-holding
  // cards cannot hide — the flag is accepted for API stability only.
  void expandOnError;
  return (
    <section aria-labelledby="profile-experience" className="space-y-6">
      <div className="card-head-title">
        <div>
          <h2 id="profile-experience" className="text-h2 font-bold text-ink">
            {copy.profile.sectionExperience}
          </h2>
          <p className="card-desc">{copy.profile.descExperience}</p>
        </div>
        {meta ? <span className="card-meta-pill">{meta}</span> : null}
      </div>
      {errors.experience ? <p className="field-alert">{errors.experience}</p> : null}
      <div className="space-y-6">
        {value.map((entry, index) => {
          const set = (patch: Partial<ProfileExperience>) =>
            onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
          // Present means null/undefined — never "" : unchecking lands on
          // "" (must pick), which is falsy but must NOT snap back to
          // checked, or the checkbox locks and the picker stays shut.
          const present = entry.end_date == null;
          // Array-level errors land on the key itself; per-bullet errors
          // (experience.i.bullets.j) surface on the shared textarea.
          const bulletsError =
            errors[`experience.${index}.bullets`] ??
            Object.entries(errors).find(([key]) => key.startsWith(`experience.${index}.bullets.`))?.[1];
          const startError = errors[`experience.${index}.start_date`];
          const endError = errors[`experience.${index}.end_date`];
          return (
            <div key={index} className="entry-card">
              <span className="entry-remove">
                <RemoveButton onClick={() => onChange(value.filter((_, i) => i !== index))} />
              </span>
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
              <div className="flex flex-wrap items-center gap-4 font-mono text-caption">
                <span className="flex items-center gap-2">
                  <label className="text-muted" htmlFor={`exp-start-${index}`}>
                    {copy.profile.dateStartPrefix}
                  </label>
                  <input
                    id={`exp-start-${index}`}
                    name={`experience[${index}].start_date`}
                    type="month"
                    aria-describedby={startError ? `exp-start-${index}-error` : undefined}
                    aria-invalid={startError ? true : undefined}
                    autoComplete="off"
                    className="month-input font-body"
                    value={entry.start_date}
                    onChange={(event) => set({ start_date: event.target.value })}
                  />
                </span>
                <span className="flex items-center gap-2">
                  <label className="text-muted" htmlFor={`exp-end-${index}`}>
                    {copy.profile.dateEndPrefix}
                  </label>
                  {present ? (
                    <input
                      id={`exp-end-${index}`}
                      type="text"
                      disabled
                      aria-label={copy.profile.endDateLabel}
                      className="month-input font-body"
                      value={copy.profile.presentLabel}
                    />
                  ) : (
                    <input
                      id={`exp-end-${index}`}
                      name={`experience[${index}].end_date`}
                      type="month"
                      aria-describedby={endError ? `exp-end-${index}-error` : undefined}
                      aria-invalid={endError ? true : undefined}
                      autoComplete="off"
                      className="month-input font-body"
                      value={entry.end_date ?? ""}
                      onChange={(event) => set({ end_date: event.target.value })}
                    />
                  )}
                </span>
                <label className="flex items-center gap-2 cursor-pointer select-none font-body text-body text-ink">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-rule text-primary focus:ring-0"
                    checked={present}
                    onChange={(event) => set({ end_date: event.target.checked ? null : "" })}
                  />
                  {copy.profile.currentRoleLabel}
                </label>
              </div>
              {(startError || endError) && (
                <p id={startError ? `exp-start-${index}-error` : `exp-end-${index}-error`} className="field-alert">
                  {startError ?? endError}
                </p>
              )}
              <div>
                <span className="label" id={`exp-bullets-${index}-label`}>
                  {copy.profile.engineeringBulletsLabel}
                </span>
                <textarea
                  id={`exp-bullets-${index}`}
                  name={`experience[${index}].bullets`}
                  rows={3}
                  aria-describedby={bulletsError ? `exp-bullets-${index}-error` : `exp-bullets-${index}-label`}
                  aria-invalid={bulletsError ? true : undefined}
                  className="textarea font-mono leading-relaxed"
                  value={bulletsToText(entry.bullets ?? [])}
                  placeholder={copy.profile.phBullets}
                  onChange={(event) => set({ bullets: textToBullets(event.target.value) })}
                />
                {bulletsError ? (
                  <p id={`exp-bullets-${index}-error`} className="field-alert">
                    {bulletsError}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <button type="button" onClick={onAdd} className="add-dashed">
          <PlusIcon size={16} />
          <span>{copy.profile.addRole}</span>
        </button>
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
  meta,
}: {
  value: ProfileEducation[];
  errors: Record<string, string>;
  expandOnError: boolean;
  onChange: (value: ProfileEducation[]) => void;
  onAdd: () => void;
  meta?: string;
}) {
  return (
    <section aria-labelledby="profile-education" className="space-y-6">
      <div className="card-head-title">
        <div>
          <h2 id="profile-education" className="text-h2 font-bold text-ink">
            {copy.profile.sectionEducation}
          </h2>
          <p className="card-desc">{copy.profile.descEducation}</p>
        </div>
        {meta ? <span className="card-meta-pill">{meta}</span> : null}
      </div>
      {errors.education ? <p className="field-alert">{errors.education}</p> : null}
      <div className="space-y-6">
        {value.map((entry, index) => {
          const set = (patch: Partial<ProfileEducation>) =>
            onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)));
          void expandOnError;
          return (
            <div key={index} className="entry-card">
              <span className="entry-remove">
                <RemoveButton onClick={() => onChange(value.filter((_, i) => i !== index))} />
              </span>
              <div className="form-grid">
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
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  id={`edu-field-${index}`}
                  name={`education[${index}].field`}
                  label={copy.profile.fieldLabel}
                  placeholder={copy.profile.phField}
                  value={entry.field ?? ""}
                  error={errors[`education.${index}.field`]}
                  onChange={(event) => set({ field: event.target.value })}
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="label" htmlFor={`edu-start-${index}`}>
                      {copy.profile.startYearLabel}
                    </label>
                    <input
                      id={`edu-start-${index}`}
                      name={`education[${index}].start_year`}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="off"
                      placeholder="YYYY"
                      className="input"
                      aria-describedby={
                        errors[`education.${index}.start_year`] ? `edu-start-${index}-error` : undefined
                      }
                      aria-invalid={errors[`education.${index}.start_year`] ? true : undefined}
                      value={entry.start_year ?? ""}
                      onChange={(event) => set({ start_year: parseYear(event.target.value) })}
                    />
                    {errors[`education.${index}.start_year`] ? (
                      <p id={`edu-start-${index}-error`} className="field-alert">
                        {errors[`education.${index}.start_year`]}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <label className="label" htmlFor={`edu-end-${index}`}>
                      {copy.profile.endYearLabel}
                    </label>
                    <input
                      id={`edu-end-${index}`}
                      name={`education[${index}].end_year`}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="off"
                      placeholder="YYYY"
                      className="input"
                      aria-describedby={
                        errors[`education.${index}.end_year`] ? `edu-end-${index}-error` : undefined
                      }
                      aria-invalid={errors[`education.${index}.end_year`] ? true : undefined}
                      value={entry.end_year ?? ""}
                      onChange={(event) => set({ end_year: parseYear(event.target.value) })}
                    />
                    {errors[`education.${index}.end_year`] ? (
                      <p id={`edu-end-${index}-error`} className="field-alert">
                        {errors[`education.${index}.end_year`]}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <button type="button" onClick={onAdd} className="add-dashed">
          <PlusIcon size={16} />
          <span>{copy.profile.addEducation}</span>
        </button>
      </div>
    </section>
  );
}

/** Section 6: languages as mock-style bordered rows. */
export function LanguagesSection({
  value,
  errors,
  expandOnError,
  onChange,
  onAdd,
  meta,
}: {
  value: ProfileLanguage[];
  errors: Record<string, string>;
  expandOnError: boolean;
  onChange: (value: ProfileLanguage[]) => void;
  onAdd: () => void;
  meta?: string;
}) {
  void expandOnError;
  return (
    <section aria-labelledby="profile-languages" className="space-y-6">
      <div className="card-head-title">
        <div>
          <h2 id="profile-languages" className="text-h2 font-bold text-ink">
            {copy.profile.sectionLanguages}
          </h2>
          <p className="card-desc">{copy.profile.descLanguages}</p>
        </div>
        {meta ? <span className="card-meta-pill">{meta}</span> : null}
      </div>
      {errors.languages ? <p className="field-alert">{errors.languages}</p> : null}
      <div className="space-y-3">
        {value.map((entry, index) => {
          const nameError = errors[`languages.${index}.language`];
          const levelError = errors[`languages.${index}.level`];
          return (
          <div key={index}>
            <div className="inline-row flex items-center gap-3 p-3 border border-rule rounded-control bg-card">
              <span className="lang-code" aria-hidden="true">
                {langCode(entry.language)}
              </span>
              <div className="flex-1 min-w-0">
                <label className="sr-only" htmlFor={`lang-name-${index}`}>
                  {copy.profile.languageLabel}
                </label>
                <input
                  id={`lang-name-${index}`}
                  name={`languages[${index}].language`}
                  type="text"
                  placeholder={copy.profile.phLanguage}
                  aria-describedby={nameError ? `lang-name-${index}-error` : undefined}
                  aria-invalid={nameError ? true : undefined}
                  autoComplete="off"
                  className="input"
                  value={entry.language}
                  onChange={(event) =>
                    onChange(value.map((l, i) => (i === index ? { ...l, language: event.target.value } : l)))
                  }
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="lang-badge hidden sm:inline">{languageBadge(entry.level)}</span>
                <div>
                  <label className="sr-only" htmlFor={`lang-level-${index}`}>
                    {copy.profile.levelLabel}
                  </label>
                  <select
                    id={`lang-level-${index}`}
                    className="select-sm select-arrow"
                    aria-describedby={levelError ? `lang-level-${index}-error` : undefined}
                    aria-invalid={levelError ? true : undefined}
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
                </div>
                <span className="ml-2">
                  <RemoveButton onClick={() => onChange(value.filter((_, i) => i !== index))} />
                </span>
              </div>
            </div>
            {nameError ? (
              <p id={`lang-name-${index}-error`} className="field-alert mt-1.5">
                {nameError}
              </p>
            ) : null}
            {levelError ? (
              <p id={`lang-level-${index}-error`} className="field-alert mt-1.5">
                {levelError}
              </p>
            ) : null}
          </div>
          );
        })}
      </div>
      <div>
        <button type="button" onClick={onAdd} className="add-dashed">
          <PlusIcon size={16} />
          <span>{copy.profile.addLanguage}</span>
        </button>
      </div>
    </section>
  );
}
