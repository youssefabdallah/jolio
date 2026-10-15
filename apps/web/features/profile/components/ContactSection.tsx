"use client";

import { copy } from "@/copy";
import { TextInput } from "@/components/ui";
import type { ProfileContact } from "@/lib/api/profile";
import CountrySelect from "./CountrySelect";
import PhoneField from "./PhoneField";

export interface ContactSectionProps {
  value: ProfileContact;
  errors: Record<string, string>;
  onChange: (value: ProfileContact) => void;
  meta?: string;
}

/** Section 1: contact details in a two-column grid. */
export function ContactSection({ value, errors, onChange, meta }: ContactSectionProps) {
  function set(key: keyof ProfileContact, next: string) {
    onChange({ ...value, [key]: next });
  }

  return (
    <section aria-labelledby="profile-contact" className="space-y-6">
      <div className="card-head-title">
        <div>
          <h2 id="profile-contact" className="text-h2 font-bold text-ink">
            {copy.profile.sectionContact}
          </h2>
          <p className="card-desc">{copy.profile.descContact}</p>
        </div>
        {meta ? <span className="card-meta-pill">{meta}</span> : null}
      </div>
      {errors.contact ? <p className="field-alert">{errors.contact}</p> : null}
      <div className="form-grid">
        <TextInput
          id="profile-full-name"
          name="fullName"
          label={copy.profile.fullNameLabel}
          placeholder={copy.profile.phFullName}
          value={value.full_name}
          autoComplete="name"
          error={errors["contact.full_name"]}
          onChange={(event) => set("full_name", event.target.value)}
        />
        <TextInput
          id="profile-email"
          name="email"
          type="email"
          label={copy.profile.emailLabel}
          placeholder={copy.profile.phEmail}
          value={value.email ?? ""}
          autoComplete="email"
          error={errors["contact.email"]}
          onChange={(event) => set("email", event.target.value)}
        />
        <PhoneField value={value.phone ?? ""} error={errors["contact.phone"]} onChange={(phone) => set("phone", phone)} />
        <TextInput
          id="profile-city"
          name="city"
          label={copy.profile.cityLabel}
          placeholder={copy.profile.phCity}
          value={value.city ?? ""}
          autoComplete="address-level2"
          error={errors["contact.city"]}
          onChange={(event) => set("city", event.target.value)}
        />
        <CountrySelect
          value={value.country ?? ""}
          error={errors["contact.country"]}
          onChange={(country) => set("country", country)}
        />
        <TextInput
          id="profile-website"
          name="website"
          type="url"
          label={copy.profile.websitePortfolioLabel}
          placeholder={copy.profile.phWebsite}
          value={value.website ?? ""}
          autoComplete="url"
          error={errors["contact.website"]}
          onChange={(event) => set("website", event.target.value)}
        />
      </div>
    </section>
  );
}
