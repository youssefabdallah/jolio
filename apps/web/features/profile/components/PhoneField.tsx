"use client";

import { useState } from "react";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { copy } from "@/copy";
import CountryCodeSelect from "./CountryCodeSelect";
import { EXCLUDED_COUNTRY_CODES } from "./countryFlag";

const COUNTRIES = getCountries() as CountryCode[];

function guessCountry(): CountryCode {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.match(/[-_]([A-Za-z]{2})\b/)?.[1]?.toUpperCase();
    if (region && (COUNTRIES as string[]).includes(region) && !EXCLUDED_COUNTRY_CODES.includes(region)) {
      return region as CountryCode;
    }
  } catch {
    // Fall through to the default below.
  }
  return "US";
}

/** Combine a country and national digits into stored E.164 form. */
function combine(nextCountry: CountryCode, nextNational: string): string {
  const digits = nextNational.replace(/[^\d]/g, "");
  if (digits === "") {
    return "";
  }
  const parsed = parsePhoneNumberFromString(digits, nextCountry);
  return parsed?.isValid() ? parsed.format("E.164") : `+${getCountryCallingCode(nextCountry)}${digits}`;
}
function splitStored(value: string): { country: CountryCode; national: string } {
  const parsed = value ? parsePhoneNumberFromString(value) : undefined;
  if (parsed?.country) {
    return { country: parsed.country, national: parsed.nationalNumber };
  }
  return { country: guessCountry(), national: value.replace(/[^\d]/g, "") };
}

/**
 * Phone input with a country-code selector joined to the number field.
 * Stores the full international number (E.164), which is exactly what
 * both validators check — the selector and the digits never travel
 * separately.
 */
export default function PhoneField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
}) {
  const [initial] = useState(() => splitStored(value));
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [national, setNational] = useState(initial.national);
  // Values arriving from outside our own emits (async profile load)
  // resync the controls; own keystrokes keep their local formatting.
  // Comparing state during render (no refs, no effects) is the
  // React-sanctioned pattern for this.
  const [lastProp, setLastProp] = useState(value);
  if (value !== lastProp) {
    setLastProp(value);
    if (value !== combine(country, national)) {
      const parts = splitStored(value);
      setCountry(parts.country);
      setNational(parts.national);
    }
  }

  function emit(nextCountry: CountryCode, nextNational: string) {
    const combined = combine(nextCountry, nextNational);
    setLastProp(combined);
    onChange(combined);
  }

  const errorId = "profile-phone-error";

  return (
    <div>
      <span className="label" id="profile-phone-label">
        {copy.profile.phoneLabel}
      </span>
      <div className="phone-join">
        <div className="phone-code shrink-0">
          <CountryCodeSelect
            value={country}
            onChange={(next) => {
              setCountry(next);
              emit(next, national);
            }}
          />
        </div>
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          aria-labelledby="profile-phone-label"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="tel"
          placeholder={copy.profile.phPhone}
          className="input phone-national"
          value={national}
          onChange={(event) => {
            setNational(event.target.value);
            emit(country, event.target.value);
          }}
        />
      </div>
      {error ? (
        <p id={errorId} className="field-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
