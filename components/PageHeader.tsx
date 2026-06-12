/** Standard employee-hub page header: specimen-label eyebrow, compact title
 *  (hierarchy from weight, not size — PRD 5.3), optional meta line and
 *  actions slot. */
export default function PageHeader({
  eyebrow,
  title,
  meta,
  actions,
}: {
  eyebrow: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line px-6 py-5">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-1 text-lg font-bold tracking-[-0.01em] text-primary">{title}</h1>
        {meta ? <div className="mt-1 text-sm text-secondary">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
