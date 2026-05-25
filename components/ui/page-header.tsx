import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
  pageTestId,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** data-testid del contenedor de página (evidencias E2E). */
  pageTestId?: string;
}) {
  return (
    <div
      data-testid={pageTestId}
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
