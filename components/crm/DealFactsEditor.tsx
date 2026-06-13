"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDeal } from "@/app/actions/crm";

/** Inline facts editing on an open deal (PRD 7.11 `updateDeal`): value and
 *  expected close for the owner; an admin may also reassign the owner.
 *  Decided deals hide this — they don't change. */
export default function DealFactsEditor({
  dealId,
  value,
  expectedCloseAt,
  ownerId,
  employees,
}: {
  dealId: string;
  value: string | null;
  expectedCloseAt: string | null;
  ownerId: string;
  /** Employee-side users for the admin reassign select; empty hides it. */
  employees: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateDeal({
        dealId,
        value: formData.get("value") ?? "",
        expectedCloseAt: formData.get("expectedCloseAt") ?? "",
        ownerId: formData.get("ownerId") ?? "",
      });
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-accent underline-offset-2 hover:underline"
      >
        Edit facts
      </button>
    );
  }

  const field =
    "h-8 w-full rounded-s border border-line bg-inset px-2.5 text-sm text-primary placeholder:text-muted";

  return (
    <form action={submit} className="space-y-3">
      <label className="block">
        <span className="eyebrow mb-1 block">Value</span>
        <input
          name="value"
          type="text"
          inputMode="decimal"
          defaultValue={value ?? ""}
          placeholder="8400.00"
          className={`${field} figure`}
        />
      </label>
      <label className="block">
        <span className="eyebrow mb-1 block">Expected close</span>
        <input
          name="expectedCloseAt"
          type="date"
          defaultValue={expectedCloseAt ? expectedCloseAt.slice(0, 10) : ""}
          className={`${field} figure`}
        />
      </label>
      {employees.length > 0 ? (
        <label className="block">
          <span className="eyebrow mb-1 block">Owner</span>
          <select name="ownerId" defaultValue={ownerId} className={field}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving" : "Save facts"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-8 rounded-s border border-line px-2.5 text-sm text-secondary hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
