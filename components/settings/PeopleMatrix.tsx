import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import Eyebrow from "@/components/Eyebrow";
import { DEPARTMENTS, PEOPLE } from "@/lib/mock";
import type { SystemRole } from "@/lib/personas";

const ROLES: SystemRole[] = ["USER", "MODERATOR", "EMPLOYEE", "CLIENT", "ADMIN"];

/** User matrix tier (PRD 7.9): ADMIN only. Department and role changes go
 *  through a confirmed action once the user tables land (M2+). */
export default function PeopleMatrix() {
  const people = PEOPLE.filter((person) => !person.isSystem);

  return (
    <section className="py-6">
      <Eyebrow as="h2">People</Eyebrow>
      <div className="mt-3 overflow-hidden rounded-m border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong">
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">
                Name
              </Eyebrow>
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">
                Email
              </Eyebrow>
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">
                Department
              </Eyebrow>
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">
                Role
              </Eyebrow>
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
                  </Link>
                </td>
                <td className="figure whitespace-nowrap px-4 text-xs text-secondary">
                  {person.email}
                </td>
                <td className="px-4">
                  <select
                    disabled
                    defaultValue={person.departmentId ?? ""}
                    className="h-7 rounded-s border border-line bg-inset px-2 text-xs disabled:text-secondary"
                  >
                    {DEPARTMENTS.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                    <option value="">None</option>
                  </select>
                </td>
                <td className="px-4">
                  <select
                    disabled
                    defaultValue={person.role}
                    className="h-7 rounded-s border border-line bg-inset px-2 text-xs disabled:text-secondary"
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
      <button
        type="button"
        disabled
        className="mt-4 h-9 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-60"
      >
        Add employee
      </button>
    </section>
  );
}
