"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { ArrowRightIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { Button, FormError, IconButton, TextInput } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { register } from "@/lib/api/auth";
import { registerSchema } from "@/lib/validation/auth";
import { isSafeNextPath } from "@/lib/auth/routes";
import { copy } from "@/copy";

type FieldErrors = Partial<Record<"display_name" | "email" | "password" | "password_confirmation", string>>;

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const displayName = String(data.get("displayName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const passwordConfirmation = String(data.get("passwordConfirmation") ?? "");

    // Fast client feedback from the shared spec (spec keys); the
    // server re-validates the same spec before touching anything.
    const raw = {
      display_name: displayName,
      email,
      password,
      password_confirmation: passwordConfirmation,
    };
    try {
      await registerSchema().validate(raw, { abortEarly: false });
    } catch (thrown) {
      if (thrown instanceof yup.ValidationError) {
        const local: FieldErrors = {};
        for (const issue of thrown.inner) {
          const key = issue.path as keyof FieldErrors | undefined;
          if (key && key in DISPLAY_KEYS && local[key] === undefined) {
            local[key] = issue.message;
          }
        }
        setFieldErrors(local);
        setFormError(null);
        return;
      }
      throw thrown;
    }
    setFieldErrors({});
    setFormError(null);

    setSubmitting(true);
    try {
      await register({ displayName, email, password, passwordConfirmation });
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(isSafeNextPath(next) ? next : "/dashboard");
    } catch (thrown) {
      if (thrown instanceof ApiError) {
        const details = thrown.body.details ?? {};
        const fields: FieldErrors = {};
        for (const [key, messages] of Object.entries(details)) {
          if (key in DISPLAY_KEYS && messages.length > 0) {
            fields[key as keyof FieldErrors] = messages[0];
          }
        }
        if (Object.keys(fields).length > 0) {
          setFieldErrors(fields);
        } else if (thrown.body.code === "EMAIL_TAKEN") {
          setFieldErrors({ email: thrown.body.message });
        } else {
          setFormError(thrown.body.message);
        }
      } else {
        setFormError(copy.common.unexpectedError);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <FormError message={formError} />

      <TextInput
        id="display-name"
        name="displayName"
        label={copy.auth.displayNameLabel}
        type="text"
        placeholder={copy.auth.displayNamePlaceholder}
        autoComplete="name"
        error={fieldErrors.display_name}
      />

      <TextInput
        id="email"
        name="email"
        label={copy.auth.workEmailLabel}
        type="email"
        placeholder={copy.auth.workEmailPlaceholder}
        autoComplete="email"
        error={fieldErrors.email}
      />

      <TextInput
        id="password"
        name="password"
        label={copy.auth.passwordLabel}
        type={showPassword ? "text" : "password"}
        placeholder={copy.auth.newPasswordPlaceholder}
        autoComplete="new-password"
        className="pr-10 tracking-wider"
        error={fieldErrors.password}
        trailing={
          <IconButton
            aria-label={showPassword ? copy.auth.hidePasswordLabel : copy.auth.showPasswordLabel}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </IconButton>
        }
      />

      <TextInput
        id="password-confirmation"
        name="passwordConfirmation"
        label={copy.auth.confirmPasswordLabel}
        type={showConfirmation ? "text" : "password"}
        placeholder={copy.auth.confirmPasswordPlaceholder}
        autoComplete="new-password"
        className="pr-10 tracking-wider"
        error={fieldErrors.password_confirmation}
        trailing={
          <IconButton
            aria-label={showConfirmation ? copy.auth.hidePasswordLabel : copy.auth.showPasswordLabel}
            onClick={() => setShowConfirmation((v) => !v)}
            className="absolute right-2.5"
          >
            {showConfirmation ? <EyeOffIcon /> : <EyeIcon />}
          </IconButton>
        }
      />

      <div className="pt-2">
        <Button type="submit" disabled={submitting} className="w-full font-bold gap-1.5">
          <span>{submitting ? copy.auth.submitting : copy.auth.signUp}</span>
          {!submitting ? <ArrowRightIcon size={16} /> : null}
        </Button>
      </div>
    </form>
  );
}

const DISPLAY_KEYS = new Set(["display_name", "email", "password", "password_confirmation"]);
