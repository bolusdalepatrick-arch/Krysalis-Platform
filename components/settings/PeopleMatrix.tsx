"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AvatarBadge from "@/components/AvatarBadge";
import Eyebrow from "@/components/Eyebrow";
import StatusBadge from "@/components/StatusBadge";
import { createEmployee, updateUserDepartment, updateUserRole } from "@/app/actions/admin";
import type { MatrixRow } from "@/lib/queries/settings";

const ROLES = ["USER", "MODERATOR", "EMPLOYEE", "CLIENT", "ADMIN"] as const;

/** User matrix (PRD 7.9): ADMIN only. Role and department changes go through
 *  confirmed actions; the confirmation copy echoes the change. */
export default function PeopleMatrix({
  people,
  departments,
}: {
  people: MatrixRow[];
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; data?: unknown; error?: string }>) {
    setConfirmation(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok && typeof result.data === "string") setConfirmation(result.data);
      if (!result.ok) setError(result.error ?? "That didn't complete. Retry.");
      // Refresh in both branches: a rejected change must repaint the
      // uncontrolled select back to the database value, not leave it showing
      // the value that didn't take.
      router.refresh();
    });
  }

  const select = "h-7 rounded-s border border-line bg-inset px-2 text-xs text-primary disabled:opacity-60";
  const field = "h-9 w-full rounded-s border border-line bg-inset px-3 text-sm text-primary";

  return (
    <section className="py-6">
      <Eyebrow as="h2">People</Eyebrow>
      {confirmation ? <p className="mt-2 text-sm text-ok">{confirmation}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-3 overflow-hidden rounded-m border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong">
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">Name</Eyebrow>
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">Email</Eyebrow>
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">Department</Eyebrow>
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">Role</Eyebrow>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="h-9 border-b border-line last:border-b-0">
                <td className="px-4">
                  <Link
                    href={`/dashboard/people/${person.id}`}
                    className="flex items-center gap-2 hover:underline underline-offset-2"
                  >
                    <AvatarBadge id={person.id} name={person.name} size={22} />
                    <span className="whitespace-nowrap">{person.name}</span>
                    {person.onboardingPending ? (
                      <StatusBadge tone="warn">Onboarding</StatusBadge>
                    ) : null}
                  </Link>
                </td>
                <td className="figure whitespace-nowrap px-4 text-xs text-secondary">{person.email}</td>
                <td className="px-4">
                  <select
                    defaultValue={person.departmentId ?? ""}
                    disabled={pending}
                    onChange={(e) =>
                      run(() => updateUserDepartment({ userId: person.id, departmentId: e.target.value }))
                    }
                    className={select}
                  >
                    <option value="">None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4">
                  <select
                    defaultValue={person.role}
                    disabled={pending}
                    onChange={(e) => run(() => updateUserRole({ userId: person.id, role: e.target.value }))}
                    className={select}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding ? (
        <form
          action={(formData) =>
            run(() =>
              createEmployee({
                name: formData.get("name"),
                email: formData.get("email"),
                departmentId: formData.get("departmentId"),
                role: formData.get("role"),
              }).then((r) => {
                if (r.ok) setAdding(false);
                return r;
              }),
            )
          }
          className="mt-4 max-w-xl space-y-3 rounded-m border border-line bg-surface p-4"
        >
          <Eyebrow as="h3">Add employee</Eyebrow>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="eyebrow mb-1.5 block">Name</span>
              <input name="name" type="text" required className={field} />
            </label>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Email</span>
              <input name="email" type="email" required className={field} />
            </label>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Department</span>
              <select name="departmentId" required className={field}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Role</span>
              <select name="role" defaultValue="EMPLOYEE" className={field}>
                <option value="EMPLOYEE">Employee</option>
                <option value="MODERATOR">Moderator</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="h-9 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
            >
              {pending ? "Adding" : "Add employee"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="h-9 rounded-s border border-line px-3 text-sm text-secondary hover:text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 h-9 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
        >
          Add employee
        </button>
      )}
    </section>
  );
}
