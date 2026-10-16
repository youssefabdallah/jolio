import { objectSchema, type FieldSpec } from "./builder";
import sourcesSpec from "../../shared/validation/sources.json";

/**
 * Sources form schema built from the canonical spec — the same file
 * StoreSourceRequest reads. Import this wherever source input is
 * validated; never hand-roll source rules in components.
 */

interface SpecFile {
  sections: Record<string, Record<string, FieldSpec>>;
}

const spec = sourcesSpec as unknown as SpecFile;

/** Whole-document source form (name, url, type, priority, country, flag). */
export function sourceSchema() {
  return objectSchema(spec.sections.source);
}
