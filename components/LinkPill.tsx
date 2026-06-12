import Link from "next/link";
import clsx from "clsx";

/** Filter / toggle pill driven by query-string links — state lives in the
 *  URL, resolved on the server (no client filter state in M0). */
export default function LinkPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={clsx(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-xs",
        active
          ? "border-line-strong bg-accent-soft font-medium text-accent"
          : "border-line text-secondary hover:bg-surface hover:text-primary",
      )}
    >
      {children}
    </Link>
  );
}
