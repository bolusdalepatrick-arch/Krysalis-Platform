/** Krysalis chrysalis mark — inline SVG, inherits theme tokens. */
export default function Logo({ size = 32, label }: { size?: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M16 2 L26 10 L23 24 L16 30 L9 24 L6 10 Z"
          fill="color-mix(in srgb, var(--accent-primary) 18%, transparent)"
          stroke="var(--accent-primary)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M16 7 L21.5 11.5 L19.8 21 L16 24.5 L12.2 21 L10.5 11.5 Z"
          fill="none"
          stroke="var(--accent-glow)"
          strokeWidth="1.2"
          strokeLinejoin="round"
          opacity="0.85"
        />
        <circle cx="16" cy="15" r="2.4" fill="var(--accent-glow)" />
      </svg>
      {label ? (
        <span className="font-display font-semibold tracking-tight text-ink leading-none">{label}</span>
      ) : null}
    </span>
  );
}
