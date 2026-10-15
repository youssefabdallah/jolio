import { objectSchema, type FieldSpec } from "./builder";
import authSpec from "../../shared/validation/auth.json";

/**
 * Auth form schemas built from the canonical spec — the same file
 * the Laravel FormRequests read. Import these wherever auth input is
 * validated; never hand-roll auth rules in components.
 */

interface SpecFile {
  sections: Record<string, Record<string, FieldSpec>>;
}

const spec = authSpec as unknown as SpecFile;

/** Sign-in form: email + password. */
export function loginSchema() {
  return objectSchema(spec.sections.login);
}

/** Registration form: display name + email + password + confirmation. */
export function registerSchema() {
  return objectSchema(spec.sections.register);
}
