import { ReactNode } from "react";

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-3 border-t border-[var(--border)] pt-4 first:border-0 first:pt-0">
      <legend className="mb-1 text-sm font-semibold text-slate-800">{title}</legend>
      {children}
    </fieldset>
  );
}
