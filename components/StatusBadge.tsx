import clsx from "clsx";

export type StatusTone = "neutral" | "accent" | "ok" | "warn" | "danger" | "info" | "gold";

const toneClass: Record<StatusTone, string> = {
  neutral: "text-secondary border-line",
  accent: "text-accent border-line-strong",
  ok: "text-ok border-line-strong",
  warn: "text-warn border-line-strong",
  danger: "text-danger border-line-strong",
  info: "text-info border-line-strong",
  gold: "text-gold border-line-strong",
};

/**
 * Status pill (PRD 5.4 allows pills for badges): outlined, text in the tone
 * color — never a filled red/green chip (PRD 5.8).
 */
export default function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "figure inline-flex items-center rounded-full border px-2 py-px text-2xs uppercase tracking-[0.08em]",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
