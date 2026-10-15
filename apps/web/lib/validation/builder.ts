import * as yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js";
import { copy } from "@/copy";

/**
 * Builds yup schemas from the canonical specs in
 * shared/validation/*.json — the same files the Laravel loader reads.
 * A spec edit updates both sides together; rules marked serverOnly
 * (e.g. DB uniqueness) are skipped here and enforced backend-side.
 */

export interface FieldSpec {
  rules?: Record<string, unknown>;
  messages?: Record<string, string>;
  fields?: Record<string, FieldSpec>;
  items?: Record<string, FieldSpec> | FieldSpec;
}

/** Resolve a spec message key (e.g. profile.validation.email_invalid) through copy.ts. */
export function resolveMessage(key: string, vars: Record<string, string | number> = {}): string {
  const [namespace, group, ...rest] = key.split(".");
  const tableName = namespace === "identity" ? "auth" : namespace;
  const table = (copy as Record<string, Record<string, string>>)[tableName] ?? {};
  const camel = rest
    .join("_")
    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  let text = table[camel] ?? (group === "validation" ? table[rest.join("_")] : undefined) ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replace(`:${name}`, String(value));
  }
  return text;
}

function messageFor(spec: FieldSpec, rule: string, fallback: string): string {
  const key = spec.messages?.[rule];
  const rules = spec.rules ?? {};
  const vars: Record<string, string | number> = {};
  if (typeof rules.min === "number") {
    vars.min = rules.min;
  }
  const max = resolveBound(rules.max);
  if (typeof max === "number") {
    vars.max = max;
  }
  return key ? resolveMessage(key, vars) : fallback;
}

function isScalarItems(items: Record<string, FieldSpec> | FieldSpec): items is FieldSpec {
  return "rules" in (items as FieldSpec);
}

function scalarSchema(spec: FieldSpec): yup.Schema {
  const rules = spec.rules ?? {};
  let schema: yup.Schema;
  // The DSL carries types as flags ({string: true} / {integer: true}),
  // mirroring Laravel rule names — there is no separate type key.
  const type = rules.integer === true ? "integer" : "string";

  if (type === "integer") {
    let number = yup.number().typeError(messageFor(spec, "integer", "Invalid number."));
    if (rules.integer !== true) {
      number = number.integer(messageFor(spec, "integer", "Must be whole."));
    }
    schema = number;
  } else {
    schema = yup.string();
    // The backend trims every stored string (and rejects blank ones),
    // so normalize here first: both sides then judge identical text,
    // and JSON.stringify drops the key for empty optionals.
    schema = (schema as yup.StringSchema).transform((value: unknown) =>
      typeof value !== "string" ? value : value.trim() === "" ? undefined : value.trim()
    );
  }

  if (rules.email) {
    schema = (schema as yup.StringSchema).email(messageFor(spec, "email", "Invalid email."));
  }
  if (rules.url) {
    schema = (schema as yup.StringSchema).url(messageFor(spec, "url", "Invalid URL."));
  }
  if (rules.phone) {
    schema = (schema as yup.StringSchema).test(
      "phone",
      messageFor(spec, "phone", "Invalid phone number."),
      (value: unknown) => typeof value === "string" && isValidPhoneNumber(value)
    );
  }
  if (typeof rules.min === "number") {
    schema = (schema as yup.StringSchema | yup.NumberSchema).min(
      rules.min,
      messageFor(spec, "min", `Minimum ${rules.min}.`)
    );
  }
  const max = resolveBound(rules.max);
  if (typeof max === "number") {
    schema = (schema as yup.StringSchema | yup.NumberSchema).max(
      max,
      messageFor(spec, "max", `Maximum ${max}.`)
    );
  }
  if (Array.isArray(rules.in)) {
    const allowed = rules.in as unknown[];
    schema = (schema as yup.StringSchema).oneOf(
      allowed as string[],
      messageFor(spec, "in", "Pick a listed value.")
    );
  }
  if (rules.date_format === "Y-m") {
    schema = (schema as yup.StringSchema).matches(
      /^\d{4}-(0[1-9]|1[0-2])$/,
      messageFor(spec, "date_format", "Use YYYY-MM.")
    );
  }

  if (rules.required === true) {
    return schema.required(messageFor(spec, "required", "Required."));
  }
  return schema.optional().nullable();
}

function resolveBound(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "object" && value !== null && "offset_from_current_year" in value) {
    return new Date().getFullYear() + Number((value as Record<string, unknown>).offset_from_current_year);
  }
  return null;
}

/** Build a yup object schema from a flat field map (supports fields/items nesting). */
export function objectSchema(fields: Record<string, FieldSpec>): yup.ObjectSchema<object> {
  const shape: Record<string, yup.Schema> = {};

  for (const [name, spec] of Object.entries(fields)) {
    const rules = spec.rules ?? {};

    if (spec.fields) {
      shape[name] =
        rules.required === true
          ? objectSchema(spec.fields).required(messageFor(spec, "required", "Required."))
          : objectSchema(spec.fields).optional().nullable();
      continue;
    }

    if (rules.array === true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let list: any;
      if (spec.items && !isScalarItems(spec.items)) {
        list = yup.array().of(objectSchema(spec.items));
      } else if (spec.items && isScalarItems(spec.items)) {
        list = yup.array().of(scalarSchema(spec.items));
      } else {
        list = yup.array().of(yup.mixed());
      }
      const max = resolveBound(rules.max);
      if (typeof max === "number") {
        list = list.max(max, messageFor(spec, "max", `Maximum ${max}.`));
      }
      shape[name] =
        rules.required === true
          ? list.required(messageFor(spec, "required", "Required."))
          : list.optional().nullable();
      continue;
    }

    if (spec.fields) {
      shape[name] =
        rules.required === true
          ? objectSchema(spec.fields).required(messageFor(spec, "required", "Required."))
          : objectSchema(spec.fields).optional().nullable();
      continue;
    }

    shape[name] = scalarSchema(spec);

    if (rules.confirmed === true) {
      const confirmName = `${name}_confirmation`;
      shape[confirmName] = yup
        .string()
        .required(messageFor(spec, "required", "Required."))
        .oneOf([yup.ref(name) as unknown as string], messageFor(spec, "confirmed", "Does not match."));
    }
  }

  return yup.object(shape);
}
