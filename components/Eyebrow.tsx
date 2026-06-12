import clsx from "clsx";

/** Specimen label (PRD 5.3): mono, uppercase, tracked. Captions every panel. */
export default function Eyebrow({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "h2" | "h3" | "span" | "th";
}) {
  return <Tag className={clsx("eyebrow", className)}>{children}</Tag>;
}
