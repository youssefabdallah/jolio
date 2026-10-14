export interface DividerProps {
  label: string;
}

export default function Divider({ label }: DividerProps) {
  return (
    <div className="relative my-6" role="separator">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-rule" />
      </div>
      <div className="relative flex justify-center text-caption">
        <span className="px-3 bg-card text-muted">{label}</span>
      </div>
    </div>
  );
}
