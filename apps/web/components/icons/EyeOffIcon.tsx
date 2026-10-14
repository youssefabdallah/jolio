import type { IconProps } from "./types";

export default function EyeOffIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 4l16 16" />
      <path d="M9.9 5.9A9.8 9.8 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a17 17 0 0 1-3.3 3.9" />
      <path d="M6 7.5A16 16 0 0 0 2 12s3.5 6.5 10 6.5c1.2 0 2.3-.2 3.3-.6" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}
