import Link from "next/link";
import clsx from "clsx";

/** Filter and view-toggle pill: a link, not a button — state lives in the URL. */
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
      className={clsx(
        "inline-flex h-7 items-center rounded-s border px-2.5 text-xs",
        active
          ? "border-line-strong bg-accent-soft text-accent"
          : "border-line text-secondary hover:text-primary",
      )}
    >
      {children}
    </Link>
  );
}
