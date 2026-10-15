import { objectSchema, type FieldSpec } from "./builder";
import profileSpec from "../../shared/validation/profile.json";

/**
 * Profile editor schema built from the canonical spec — the same file
 * UpdateProfileRequest reads. Import this wherever profile input is
 * validated; never hand-roll profile rules in components.
 */

interface SpecFile {
  sections: Record<string, Record<string, FieldSpec>>;
}

const spec = profileSpec as unknown as SpecFile;

/** Whole-document profile form (contact, headline, sections). */
export function profileSchema() {
  return objectSchema(spec.sections.profile);
}

/** One repeatable section on its own — gates the Add buttons. */
export function sectionSchema(name: "skills" | "experience" | "education" | "languages") {
  return objectSchema({ [name]: spec.sections.profile[name] });
}
