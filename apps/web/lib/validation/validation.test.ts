import { describe, expect, it } from "vitest";
import * as yup from "yup";
import { loginSchema, registerSchema } from "./auth";
import { profileSchema } from "./profile";
import { sourceSchema } from "./sources";
import { splitBlockText } from "../../features/profile/components/RichBullets";
describe("bullet text splitting (rich editor boundary)", () => {
  it("splits lines and drops blanks", () => {
    expect(splitBlockText("  Shipped billing.\n\nCut latency.  \n")).toEqual([
      "Shipped billing.",
      "Cut latency.",
    ]);
    expect(splitBlockText("   ")).toEqual([]);
  });
});
import { COMPLETION_WEIGHTS, completionTone, estimateCompletion } from "../../features/profile/completion";
import { emptyProfileInput, type ProfileInput } from "../../lib/api/profile";
import { resolveMessage } from "./builder";
import { copy } from "@/copy";

async function messages(schema: yup.AnySchema, value: unknown): Promise<string[]> {
  try {
    await schema.validate(value, { abortEarly: false });
    return [];
  } catch (thrown) {
    if (thrown instanceof yup.ValidationError) {
      return thrown.inner.map((issue) => `${issue.path}: ${issue.message}`).sort();
    }
    throw thrown;
  }
}

describe("resolveMessage", () => {
  it("maps backend keys to copy.ts text", () => {
    expect(resolveMessage("identity.validation.display_name_required")).toBe(copy.auth.displayNameRequired);
    expect(resolveMessage("profile.validation.skill_level_in")).toBe(copy.profile.skillLevelIn);
  });

  it("interpolates rule bounds", () => {
    expect(resolveMessage("identity.validation.password_min", { min: 8 })).toBe(
      "Use at least 8 characters for your password."
    );
  });

  it("falls back to the key when unmapped", () => {
    expect(resolveMessage("nope.missing")).toBe("nope.missing");
  });
});

describe("auth schemas (mirror shared/validation/auth.json)", () => {
  it("accepts a valid login and registration", async () => {
    await expect(loginSchema().validate({ email: "alex@example.com", password: "s3cret-pass" })).resolves.toMatchObject({
      email: "alex@example.com",
    });
    await expect(
      registerSchema().validate({
        display_name: "Alex",
        email: "alex@example.com",
        password: "s3cret-pass",
        password_confirmation: "s3cret-pass",
      })
    ).resolves.toMatchObject({ display_name: "Alex" });
  });

  it("rejects with the backend-identical messages", async () => {
    expect(await messages(loginSchema(), { email: "nope", password: "" })).toEqual([
      "email: That email address does not look right.",
      "password: A password is required.",
    ]);
    expect(
      await messages(registerSchema(), {
        display_name: "",
        email: "alex@example.com",
        password: "short",
        password_confirmation: "different",
      })
    ).toEqual([
      "display_name: Please tell us your display name.",
      "password: Use at least 8 characters for your password.",
      "password_confirmation: The password confirmation does not match.",
    ]);
  });
});

describe("profile schema (mirrors shared/validation/profile.json)", () => {
  it("accepts a complete document and drops blank strings", async () => {
    const result = (await profileSchema().validate({
      contact: {
        full_name: "Alex Dev",
        email: "alex@example.com",
        phone: "+16502530000",
        city: "Berlin",
        country: "Germany",
        website: "https://alex.dev",
      },
      headline: "Senior PHP Developer",
      summary: "Backend engineer.",
      skills: [{ group: "Backend", name: "PHP", level: "advanced" }],
      experience: [{ role: "Dev", company: "Acme", location: "Berlin", start_date: "2021-03", end_date: "" }],
      education: [{ institution: "TU", degree: "BSc", field: "CS", start_year: 2014 }],
      languages: [{ language: "English", level: "c1" }],
    })) as { contact: Record<string, unknown>; experience: Array<Record<string, unknown>> };
    expect(result.contact).toMatchObject({ full_name: "Alex Dev" });
    expect(result.experience[0]).not.toHaveProperty("end_date");
  });

  it("rejects with the backend-identical messages", async () => {
    expect(
      await messages(profileSchema(), {
        contact: {
          full_name: "",
          email: "a@b.co",
          phone: "not-a-number",
          city: "B",
          country: "G",
          website: "https://a.dev",
        },
        headline: "Dev",
        summary: "S",
        skills: [{ group: "Backend", name: "PHP", level: "wizard" }],
        experience: [{ role: "Dev", company: "Acme", location: "B", start_date: "March 2021" }],
        education: [{ institution: "TU", degree: "BSc", field: "CS", start_year: 2014 }],
        languages: [{ language: "English", level: "c1" }],
      })
    ).toEqual([
      "contact.full_name: Please tell us your full name.",
      "contact.phone: That phone number does not look valid.",
      "experience[0].start_date: Use YYYY-MM for the start date.",
      "skills[0].level: Pick a listed skill level.",
    ]);
  });

  it("validates real diallable numbers from the spec phone rule", async () => {
    const base = {
      contact: {
        full_name: "Alex Dev",
        email: "a@b.co",
        phone: "+16502530000",
        city: "B",
        country: "G",
        website: "https://a.dev",
      },
      headline: "Dev",
      summary: "S",
      skills: [{ group: "B", name: "PHP", level: "advanced" }],
      experience: [{ role: "D", company: "A", location: "B", start_date: "2021-03" }],
      education: [{ institution: "TU", degree: "BSc", field: "CS", start_year: 2014 }],
      languages: [{ language: "English", level: "c1" }],
    };
    await expect(profileSchema().validate(base)).resolves.toBeDefined();
  });

  it("resolves the dynamic year cap from the current year", async () => {
    const farFuture = new Date().getFullYear() + 6;
    expect(
      await messages(profileSchema(), {
        contact: { full_name: "Alex Dev", email: "a@b.co", phone: "+16502530000", city: "B", country: "G", website: "https://a.dev" },
        headline: "Dev",
        summary: "S",
        skills: [{ group: "B", name: "PHP", level: "advanced" }],
        experience: [{ role: "D", company: "A", location: "B", start_date: "2021-03" }],
        education: [{ institution: "TU", degree: "BSc", field: "CS", start_year: 2014, end_year: farFuture }],
        languages: [{ language: "English", level: "c1" }],
      })
    ).toEqual([`education[0].end_year: That year is too far in the future.`]);
  });
});

describe("live completion estimator (mirrors ProfileCompletion)", () => {
  const full: ProfileInput = {
    contact: {
      full_name: "Alex Dev",
      email: "a@b.co",
      phone: "1",
      city: "B",
      country: "G",
      website: "https://a.dev",
    },
    headline: "Dev",
    summary: "S",
    skills: [{ group: "B", name: "PHP", level: "advanced" }],
    experience: [{ role: "D", company: "A", location: "B", start_date: "2021-03" }],
    education: [{ institution: "TU", degree: "BSc", field: "CS", start_year: 2014 }],
    languages: [{ language: "English", level: "c1" }],
  };

  it("weights cover the whole scale", () => {
    expect(Object.values(COMPLETION_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  });

  it("scores empty, partial, and full documents with traffic tones", () => {
    expect(estimateCompletion(emptyProfileInput)).toBe(0);
    expect(completionTone(0)).toBe("red");
    expect(estimateCompletion({ ...emptyProfileInput, headline: "Dev" })).toBe(10);
    expect(completionTone(33)).toBe("red");
    expect(
      estimateCompletion({
        ...emptyProfileInput,
        headline: "Dev",
        summary: "S",
        skills: [{ group: "B", name: "PHP", level: "advanced" }],
      })
    ).toBe(30);
    expect(completionTone(34)).toBe("orange");
    expect(completionTone(69)).toBe("orange");
    expect(estimateCompletion(full)).toBe(100);
    expect(completionTone(100)).toBe("green");
  });
});

describe("sources schema (mirrors shared/validation/sources.json)", () => {
  const valid = {
    name: "Arbeitnow",
    url: "https://www.arbeitnow.com/api/job-board-api",
    type: "search_engine",
    priority: "T2",
    country_code: "DE",
    is_enabled: true,
  };

  it("accepts a complete document", async () => {
    expect(await sourceSchema().validate(valid)).toMatchObject({ name: "Arbeitnow" });
  });

  it("rejects with the backend-identical messages", async () => {
    expect(
      await messages(sourceSchema(), {
        ...valid,
        name: "",
        type: "scraper",
        is_enabled: "yes",
      })
    ).toEqual([
      "is_enabled: The enabled flag must be true or false.",
      "name: Please name the source.",
      "type: Pick a listed source type.",
    ]);
  });
});
