import type { ButtonHTMLAttributes } from "react";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Transparent icon-only button (toggles, clear/close actions). */
export default function IconButton({ className = "", type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      className={`flex items-center justify-center text-muted hover:text-ink p-1 ${className}`}
      {...rest}
    />
  );
}
