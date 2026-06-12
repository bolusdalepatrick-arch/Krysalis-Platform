import Eyebrow from "@/components/Eyebrow";
import type { Persona } from "@/lib/personas";

/** Profile tier (PRD 7.9): every role sees this. Name and title become
 *  editable when the profile action lands on the database (M2+). */
export default function ProfileSection({
  persona,
  email,
}: {
  persona: Persona;
  email?: string;
}) {
  return (
    <section className="py-6">
      <Eyebrow as="h2">Profile</Eyebrow>
      <div className="mt-3 rounded-m border border-line bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow mb-1.5 block">Name</span>
            <input
              type="text"
              name="name"
              disabled
              defaultValue={persona.name}
              className="h-10 w-full rounded-s border border-line bg-inset px-3 disabled:text-secondary"
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Title</span>
            <input
              type="text"
              name="title"
              disabled
              defaultValue={persona.title}
              className="h-10 w-full rounded-s border border-line bg-inset px-3 disabled:text-secondary"
            />
          </label>
        </div>
        <dl className="mt-6">
          <div className="flex items-baseline justify-between border-t border-line py-3">
            <dt className="eyebrow">Email</dt>
            <dd className="figure text-sm text-secondary">{email ?? "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line py-3">
            <dt className="eyebrow">Role</dt>
            <dd className="figure text-sm text-secondary">{persona.role}</dd>
          </div>
        </dl>
        <button
          type="button"
          disabled
          className="mt-3 h-9 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-60"
        >
          Save profile
        </button>
      </div>
    </section>
  );
}
