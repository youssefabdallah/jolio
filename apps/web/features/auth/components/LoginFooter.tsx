import { copy } from "@/copy";

export default function LoginFooter() {
  return (
    <footer className="py-4 text-center text-caption text-muted">{copy.auth.footer}</footer>
  );
}
