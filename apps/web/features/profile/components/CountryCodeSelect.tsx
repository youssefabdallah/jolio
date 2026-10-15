"use client";

import { useMemo } from "react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { copy } from "@/copy";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/inputs/Autocomplete";
import { ChevronDownIcon } from "@/components/icons";
import { countryFlag, EXCLUDED_COUNTRY_CODES } from "./countryFlag";

const COUNTRIES = getCountries() as CountryCode[];

export interface CountryEntry {
  code: CountryCode;
  name: string;
  calling: string;
}

function countryName(code: CountryCode, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Searchable country-code picker. A native select with 245 options
 * is unusable; this filters by name, ISO code, or digits while keeping
 * full keyboard support (arrows, Enter, Escape) and ARIA roles.
 * Options arrive as data props to the shared Autocomplete (menu
 * variant: compact button trigger, search field inside the dropdown).
 */
export default function CountryCodeSelect({
  value,
  onChange,
}: {
  value: CountryCode;
  onChange: (code: CountryCode) => void;
}) {
  const entries = useMemo(() => {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return COUNTRIES.filter((code) => !EXCLUDED_COUNTRY_CODES.includes(code)).map((code) => ({
      code,
      name: countryName(code, locale),
      calling: getCountryCallingCode(code),
    })).sort((a, b) => a.name.localeCompare(b.name, locale));
  }, []);

  const options = useMemo<AutocompleteOption[]>(
    () =>
      entries.map((entry) => ({
        value: entry.code,
        label: `+${entry.calling} · ${entry.name}`,
        keywords: `${entry.name} ${entry.code} ${entry.calling}`,
        leading: <span>{countryFlag(entry.code)}</span>,
        hint: `+${entry.calling}`,
      })),
    [entries]
  );

  const current = entries.find((entry) => entry.code === value);

  return (
    <Autocomplete
      id="country-code"
      label={copy.profile.countryCodeLabel}
      value={value}
      options={options}
      // Invariant: every option value is a CountryCode built above,
      // so the menu variant only ever emits valid codes.
      onChange={(next) => onChange(next as CountryCode)}
      emptyText={copy.profile.autocompleteEmpty}
      trigger={
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="text-caption leading-none">{current ? countryFlag(current.code) : ""}</span>
          <span className="text-caption leading-none">+{current?.calling ?? ""}</span>
          <ChevronDownIcon size={14} className="text-muted" />
        </span>
      }
      searchLabel={copy.profile.countrySearchLabel}
      searchPlaceholder={copy.profile.countrySearchPlaceholder}
    />
  );
}
