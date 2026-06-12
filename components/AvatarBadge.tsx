import { avatarHue, initials } from "@/lib/format";

/**
 * Generated-initials avatar (PRD 5.8): a deterministic hue from the user id,
 * mixed into the theme's raised surface so it sits naturally in both scopes.
 * No photo placeholders.
 */
export default function AvatarBadge({
  id,
  name,
  size = 28,
}: {
  id: string;
  name: string;
  size?: number;
}) {
  const hue = avatarHue(id);
  return (
    <span
      aria-hidden
      className="figure inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        backgroundColor: `color-mix(in oklab, hsl(${hue} 60% 55%) 26%, var(--color-bg-raised))`,
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-line)",
      }}
    >
      {initials(name)}
    </span>
  );
}
