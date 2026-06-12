"use client";

function initials(name: string) {
  return name
    .replace(/^Dr\.\s+/, "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Glowing-ring avatar marking an AI agent as visibly non-human (PRD §5). */
export function AgentAvatar({
  name,
  status,
  size = 38,
}: {
  name: string;
  status: "running" | "idle";
  size?: number;
}) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={`grid h-full w-full place-items-center rounded-full bg-surface ring-2 ring-glow agent-glow ${
          status === "running" ? "agent-glow-pulse" : ""
        } text-glow font-display font-semibold`}
        style={{ fontSize: size * 0.34 }}
      >
        {initials(name)}
      </span>
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-canvas ${
          status === "running" ? "bg-glow animate-dotpulse" : "bg-soft"
        }`}
        aria-hidden
      />
    </span>
  );
}

export function HumanAvatar({ name, online, size = 38 }: { name: string; online?: boolean; size?: number }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="grid h-full w-full place-items-center rounded-full bg-accent/15 border border-ink/10 text-ink/90 font-display font-semibold"
        style={{ fontSize: size * 0.34 }}
      >
        {initials(name)}
      </span>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-canvas ${
            online ? "bg-glow" : "bg-soft/50"
          }`}
          aria-hidden
        />
      )}
    </span>
  );
}

/** Interactive role badge pill — identical in the co-worker list and squad deck. */
export function AgentBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-glow/50 bg-glow/10 px-2 py-0.5 text-[11px] font-medium leading-4 text-glow whitespace-nowrap transition-colors hover:bg-glow/20">
      Agent: {role}
    </span>
  );
}
