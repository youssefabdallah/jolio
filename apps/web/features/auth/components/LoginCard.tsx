import Link from "next/link";
import { copy } from "@/copy";
import { Divider } from "@/components/ui";
import GoogleButton from "./GoogleButton";
import LoginBrand from "./LoginBrand";
import LoginForm from "./LoginForm";

export default function LoginCard() {
  return (
    <div className="w-full max-w-auth bg-card rounded-card border border-rule p-8 my-8">
      <LoginBrand />
      <LoginForm />
      <Divider label={copy.auth.orContinueWith} />
      <GoogleButton />

      <div className="mt-6 text-center">
        <p className="text-body text-muted">
          {copy.auth.noAccount}{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            {copy.auth.createAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
