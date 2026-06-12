/**
 * The chrysalis glyph (PRD 5.9) — a teardrop cocoon outline, the product's
 * only custom mark. It labels everything the Shadow produced; nothing else
 * wears it.
 */
export default function ChrysalisGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 1.2 C 9.6 3.2, 11 5.6, 11 8 a 4 4.6 0 0 1 -8 0 C 3 5.6, 4.4 3.2, 7 1.2 Z" />
      <path d="M7 4.6 v 4.2" opacity={0.55} />
    </svg>
  );
}
