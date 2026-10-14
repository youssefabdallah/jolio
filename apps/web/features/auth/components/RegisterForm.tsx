"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { Button, FormError, IconButton, TextInput } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { register } from "@/lib/api/auth";
import { isSafeNextPath } from "@/lib/auth/routes";
import { copy } from "@/copy";

type FieldErrors = Partial<Record<"display_name" | "email" | "password" | "password_confirmation", string>>;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    // Fast client feedback; the server re-validates everything.
    const local: FieldErrors = {};
    if (!displayName) {
      local.display_name = copy.auth.displayNameRequired;
    }
    if (!EMAIL_SHAPE.test(email)) {
      local.email = copy.auth.emailInvalid;
    }
    if (password.length < 8) {
      local.password = copy.auth.passwordMin;
    }
    if (passwordConfirmation !== password) {
      local.password_confirmation = copy.auth.passwordMismatch;
    }
    setFieldErrors(local);
    setFormError(null);
    if (Object.keys(local).length > 0) {
      return;
    }

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
