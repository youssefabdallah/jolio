import { describe, expect, it } from "vitest";
import { filterAutocompleteOptions, type AutocompleteOption } from "./autocomplete";
import taxonomy from "../features/profile/data/skills-taxonomy.json";

const OPTIONS: AutocompleteOption[] = [
  { value: "Backend", label: "Backend", keywords: "BE" },
  { value: "PHP", label: "PHP", keywords: "php hypertext", hint: "Backend" },
  { value: "DE", label: "Germany", keywords: "de deutschland", hint: "+49" },
];

describe("filterAutocompleteOptions", () => {
  it("returns the full list on an empty query", () => {
    expect(filterAutocompleteOptions(OPTIONS, "")).toHaveLength(3);
    expect(filterAutocompleteOptions(OPTIONS, "   ")).toHaveLength(3);
  });

  it("matches case-insensitively across label, value, keywords, and hint", () => {
    expect(filterAutocompleteOptions(OPTIONS, "php").map((o) => o.value)).toEqual(["PHP"]);
    expect(filterAutocompleteOptions(OPTIONS, "backend").map((o) => o.value)).toEqual([
      "Backend",
      "PHP",
    ]);
    expect(filterAutocompleteOptions(OPTIONS, "deutschland").map((o) => o.value)).toEqual(["DE"]);
    expect(filterAutocompleteOptions(OPTIONS, "+49").map((o) => o.value)).toEqual(["DE"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterAutocompleteOptions(OPTIONS, "zzz-no-match")).toEqual([]);
  });
});

describe("skills taxonomy", () => {
  it("holds a curated starter catalog", () => {
    expect(taxonomy.groups.length).toBeGreaterThanOrEqual(10);
  });

  it("keeps group names unique and every group populated", () => {
    const names = taxonomy.groups.map((group) => group.name);
    expect(new Set(names).size).toBe(names.length);
    for (const group of taxonomy.groups) {
      expect(group.name.trim().length).toBeGreaterThan(0);
      expect(group.skills.length).toBeGreaterThanOrEqual(5);
      for (const skill of group.skills) {
        expect(skill.trim().length).toBeGreaterThan(0);
      }
      expect(new Set(group.skills).size).toBe(group.skills.length);
    }
  });
});
