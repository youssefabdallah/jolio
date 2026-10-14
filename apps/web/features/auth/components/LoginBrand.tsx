import { copy } from "@/copy";

export default function LoginBrand() {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-ink rounded flex items-center justify-center text-paper font-mono text-body font-bold">
          {copy.auth.brandInitial}
        </div>
        <h1 className="text-h1 font-bold tracking-tight text-ink">
          {copy.auth.brandName}
        </h1>
      </div>
      <p className="text-body text-muted mt-2">{copy.auth.subtitle}</p>
    </div>
  );
}
