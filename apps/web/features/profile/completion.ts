import type { ProfileInput } from "@/lib/api/profile";

/**
 * Live client mirror of the server calculator
 * (Src\Profile\Domain\Services\ProfileCompletion): same weights, same
 * completeness rules. Display-only — the stored score always comes
 * from the server after a save. Both sides assert the weights sum to
 * 100 in their own suites; a weight change must touch both files.
 */
export const COMPLETION_WEIGHTS = {
  contact: 20,
  headline: 10,
  summary: 5,
  skills: 15,
  experience: 25,
  education: 10,
  languages: 15,
} as const;

export function estimateCompletion(input: ProfileInput): number {
  let score = 0;
  const contact = input.contact;
  if (
    contact.full_name.trim() !== "" &&
    (contact.email ?? "").trim() !== "" &&
    (contact.phone ?? "").trim() !== "" &&
    (contact.city ?? "").trim() !== "" &&
    (contact.country ?? "").trim() !== ""
  ) {
    score += COMPLETION_WEIGHTS.contact;
  }
  if ((input.headline ?? "").trim() !== "") {
    score += COMPLETION_WEIGHTS.headline;
  }
  if ((input.summary ?? "").trim() !== "") {
    score += COMPLETION_WEIGHTS.summary;
  }
  if ((input.skills ?? []).some((skill) => skill.group.trim() !== "" && skill.name.trim() !== "")) {
    score += COMPLETION_WEIGHTS.skills;
  }
  if (
    (input.experience ?? []).some(
      (entry) => entry.role.trim() !== "" && entry.company.trim() !== "" && entry.start_date.trim() !== ""
    )
  ) {
    score += COMPLETION_WEIGHTS.experience;
  }
  if (
    (input.education ?? []).some((entry) => entry.institution.trim() !== "" && entry.degree.trim() !== "")
  ) {
    score += COMPLETION_WEIGHTS.education;
  }
  if ((input.languages ?? []).some((entry) => entry.language.trim() !== "")) {
    score += COMPLETION_WEIGHTS.languages;
  }
  return Math.min(100, score);
}

export function completionTone(score: number): "red" | "orange" | "green" {
  if (score < 34) {
    return "red";
  }
  if (score < 70) {
    return "orange";
  }
  return "green";
}
