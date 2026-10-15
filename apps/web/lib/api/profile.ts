import { ApiError, getJson, postJson } from "./client";

export interface ProfileContact {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  website?: string | null;
}

export interface ProfileSkill {
  group: string;
  name: string;
  level: string;
}

export interface ProfileExperience {
  role: string;
  company: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  bullets?: string[];
}

export interface ProfileEducation {
  institution: string;
  degree: string;
  field?: string | null;
  start_year?: number | null;
  end_year?: number | null;
}

export interface ProfileLanguage {
  language: string;
  level: string;
}

export interface CandidateProfile {
  id: string;
  contact: ProfileContact;
  headline: string | null;
  summary: string | null;
  skills: ProfileSkill[];
  experience: ProfileExperience[];
  education: ProfileEducation[];
  languages: ProfileLanguage[];
  current_step: string | null;
  completion_percent: number;
}

export interface ProfileInput {
  contact: ProfileContact;
  headline?: string | null;
  summary?: string | null;
  skills?: ProfileSkill[];
  experience?: ProfileExperience[];
  education?: ProfileEducation[];
  languages?: ProfileLanguage[];
  current_step?: string | null;
}

export const emptyProfileInput: ProfileInput = {
  contact: { full_name: "" },
  headline: null,
  summary: null,
  skills: [],
  experience: [],
  education: [],
  languages: [],
};

/**
 * Read the caller's profile via the same-origin proxy. Null when the
 * user never saved one — the editor renders a blank form. Only 401
 * means "not signed in"; anything else surfaces to the caller.
 */
export async function getProfile(): Promise<CandidateProfile | null> {
  return getJson<CandidateProfile | null>("/api/profile");
}

/**
 * Replace the caller's profile. Accepts a full document or a step
 * slice plus a resume stamp — the API validates the named step's
 * section and merges the rest with what is stored.
 */
export function putProfile(
  input: Partial<ProfileInput> & { current_step?: string | null }
): Promise<{ profile: CandidateProfile }> {
  // Profile writes are upserts: same payload twice is harmless, so one
  // retry rides out backend restarts instead of failing the wizard.
  return postJson("/api/profile", input, "PUT", 1);
}

/** Re-export for callers that branch on 401 vs outage. */
export { ApiError };
