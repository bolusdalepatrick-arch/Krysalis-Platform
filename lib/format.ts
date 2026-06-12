/** Data formatting per PRD 5.8. Money renders in the mono face with two
 *  decimals and thousands separators; dates are short in tables and spelled
 *  out as page context. */

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return money.format(n);
}

/** "Jun 12, 2026" — tables and metadata. */
export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Thursday, June 12" — the page-context date line. */
export function formatDayContext(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Chat timestamps: "14:32" same-day, "Jun 11, 14:32" otherwise. */
export function formatChatTime(d: Date | string, now = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return time;
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${day}, ${time}`;
}

/** Deterministic avatar hue from a user id (PRD 5.8) — initials on a hue,
 *  no photo placeholders. */
export function avatarHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
