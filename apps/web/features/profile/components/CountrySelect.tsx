"use client";

import { useMemo } from "react";
import { getCountries, type CountryCode } from "libphonenumber-js";
import { copy } from "@/copy";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/inputs/Autocomplete";
import { countryFlag, EXCLUDED_COUNTRY_CODES } from "./countryFlag";

/**
 * Strict country combobox: the value can only ever be a real country.
 * Free text that matches nothing reverts to the stored value with a
 * friendly message, so an unknown country can never be submitted.
 * Data (options) arrives as props to the shared Autocomplete; this
 * only builds the pool from libphonenumber country codes.
 */
export default function CountrySelect({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
}) {
  const options = useMemo<AutocompleteOption[]>(
    () =>
      (getCountries() as CountryCode[])
        .filter((code) => !EXCLUDED_COUNTRY_CODES.includes(code))
        .map((code) => {
          let name: string;
          try {
            name = new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
          } catch {
            name = code;
          }
          return {
            value: name,
            label: name,
            keywords: code,
            leading: <span>{countryFlag(code)}</span>,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label, "en")),
    []
  );

  return (
    <Autocomplete
      id="profile-country"
      label={copy.profile.countryLabel}
      value={value}
      options={options}
      onChange={onChange}
      placeholder={copy.profile.phCountry}
      name="country"
      autoComplete="country-name"
      error={error}
      emptyText={copy.profile.autocompleteEmpty}
      invalidText={copy.profile.countryInvalid}
      allowCustom={false}
    />
  );
}
