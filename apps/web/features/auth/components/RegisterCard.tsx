import Link from "next/link";
import { Divider } from "@/components/ui";
import { copy } from "@/copy";
import GoogleButton from "./GoogleButton";
import LoginBrand from "./LoginBrand";
import RegisterForm from "./RegisterForm";

export default function RegisterCard() {
  return (
    <div className="w-full max-w-auth bg-card rounded-card border border-rule p-8 my-8">
      <LoginBrand />
      <h2 className="text-h2 font-bold text-ink text-center mt-6 mb-1">
        {copy.auth.registerHeading}
      </h2>
      <p className="text-caption text-muted text-center mb-6">{copy.auth.registerSubtext}</p>
      <RegisterForm />
      <Divider label={copy.auth.orContinueWith} />
      <GoogleButton />

      <div className="mt-6 text-center">
        <p className="text-body text-muted">
          {copy.auth.alreadyHaveAccount}{" "}
          <Link href="/" className="text-primary font-medium hover:underline">
            {copy.auth.signInLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
