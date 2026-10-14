export interface FormErrorProps {
  message: string | null;
}

/**
 * Form-level error banner. Rendered only when a message exists;
 * announced to assistive tech via role="alert".
 */
export default function FormError({ message }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className="text-caption text-danger-deep bg-danger-bg border border-danger rounded-control px-3 py-2"
    >
      {message}
    </p>
  );
}
