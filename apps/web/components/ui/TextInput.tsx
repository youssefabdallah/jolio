import type { InputHTMLAttributes, ReactNode } from "react";

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: ReactNode;
  /** Right-side element on the label row (e.g. "Forgot password?" link). */
  labelAction?: ReactNode;
  /** Element pinned inside the input's right edge (e.g. password toggle). */
  trailing?: ReactNode;
  /** Field-level error: announced via aria-describedby, styled in danger. */
  error?: string | null;
}

export default function TextInput({
  id,
  label,
  labelAction,
  trailing,
  error,
  className = "",
  ...rest
}: TextInputProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label !mb-0 font-bold" htmlFor={id}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative flex items-center">
        <input
          id={id}
          className={`input ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {trailing}
      </div>
      {error ? (
        <p id={errorId} className="text-caption text-danger-deep mt-1">
          {error}
        </p>
      ) : null}
    </div>
  );
}
