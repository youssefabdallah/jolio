"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { Button, FormError, IconButton, TextInput } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { isSafeNextPath } from "@/lib/auth/routes";
import { copy } from "@/copy";

type FieldErrors = Partial<Record<"email" | "password", string>>;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    // Fast client feedback; the server re-validates everything.
    const local: FieldErrors = {};
    if (!EMAIL_SHAPE.test(email)) {
      local.email = copy.auth.emailInvalid;
    }
    if (!password) {
      local.password = copy.auth.passwordRequired;
    }
    setFieldErrors(local);
    setFormError(null);
    if (Object.keys(local).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
      // Post-login return: only a validated same-origin path is honored;
      // anything else (absolute URLs, //evil, backslashes) falls back to
      // the dashboard, so ?next= can never become an open redirect.
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(isSafeNextPath(next) ? next : "/dashboard");
    } catch (thrown) {
      if (thrown instanceof ApiError) {
        const details = thrown.body.details ?? {};
        const fields: FieldErrors = {};
        for (const [key, messages] of Object.entries(details)) {
          if ((key === "email" || key === "password") && messages.length > 0) {
            fields[key] = messages[0];
          }
        }
        setFieldErrors(fields);
        if (Object.keys(fields).length === 0) {
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
        id="email"
        name="email"
        label={copy.auth.emailLabel}
        type="email"
        placeholder={copy.auth.emailPlaceholder}
        autoComplete="email"
        error={fieldErrors.email}
      />

      <TextInput
        id="password"
        name="password"
        label={copy.auth.passwordLabel}
        type={showPassword ? "text" : "password"}
        placeholder={copy.auth.passwordPlaceholder}
        autoComplete="current-password"
        className="pr-10 tracking-wider"
        error={fieldErrors.password}
        labelAction={
          <a href="#" className="text-caption text-primary hover:underline">
            {copy.auth.forgotPassword}
          </a>
        }
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

      <div className="pt-2">
        <Button type="submit" disabled={submitting} className="w-full font-bold gap-1.5">
          <span>{submitting ? copy.auth.signingIn : copy.auth.signIn}</span>
          {!submitting ? <ArrowRightIcon size={16} /> : null}
        </Button>
      </div>
    </form>
  );
}
