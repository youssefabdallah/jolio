import { OAuthCallback } from "@/features/auth";

export default function OAuthCallbackPage() {
  return (
    <div className="flex flex-col flex-1 justify-between selection:bg-primary selection:text-white">
      <main className="flex-1 flex items-center justify-center p-4">
        <OAuthCallback />
      </main>
    </div>
  );
}
