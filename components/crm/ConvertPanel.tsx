"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { convertWonDeal } from "@/app/actions/crm";
import Eyebrow from "@/components/Eyebrow";
import { useToast } from "@/components/toast/ToastProvider";
import { formatMoney } from "@/lib/format";

/**
 * "Convert to engagement" (PRD 7.11, as amended pre-M5): account to ACTIVE
 * with its thread, a portal user from the primary contact — on by default,
 * the admin may exclude — and the engagement as a prefilled draft the admin
 * confirms: optional, never silent. Re-runnable; provisioning find-or-skips.
 */
export default function ConvertPanel({
  dealId,
  dealTitle,
  value,
  accountName,
  accountKind,
  accountHasThread,
  accountHasPortalUser,
  contact,
  jobId,
  departments,
}: {
  dealId: string;
  dealTitle: string;
  value: string;
  accountName: string;
  accountKind: "INDIVIDUAL" | "BUSINESS";
  accountHasThread: boolean;
  accountHasPortalUser: boolean;
  contact: { name: string; email: string } | null;
  jobId: string | null;
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withJob, setWithJob] = useState(jobId === null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await convertWonDeal({
        dealId,
        provisionPortalUser: formData.get("provisionPortalUser") === "on",
        accountKind: formData.get("accountKind"),
        draftJob:
          withJob && jobId === null
            ? {
                title: formData.get("title"),
                brief: formData.get("brief"),
                description: formData.get("description") ?? "",
                departmentId: formData.get("departmentId"),
                workerPool: formData.get("workerPool"),
                dueAt: formData.get("dueAt") ?? "",
              }
            : undefined,
      });
      if (result.ok) {
        push(`Converted — ${result.data.accountName} is active.`);
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const field =
    "h-9 w-full rounded-s border border-line bg-inset px-3 text-md text-primary placeholder:text-muted";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover"
      >
        Convert to engagement
      </button>
    );
  }

  return (
    <form action={submit} className="max-w-2xl space-y-4 rounded-m border border-line bg-surface p-4">
      <Eyebrow as="h2">Convert to engagement</Eyebrow>
      <p className="text-sm text-secondary">
        {accountName} becomes active
        {accountHasThread ? "; its message thread already exists" : " and gets its message thread"}.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="eyebrow mb-1.5 block">Account kind</span>
          <select name="accountKind" defaultValue={accountKind} className={field}>
            <option value="BUSINESS">Business</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
        </label>
        <div>
          <span className="eyebrow mb-1.5 block">Portal access</span>
          {accountHasPortalUser ? (
            <p className="flex h-9 items-center text-sm text-secondary">
              Already attached — provisioning skips.
            </p>
          ) : contact ? (
            <label className="flex h-9 items-center gap-2 text-sm text-primary">
              <input type="checkbox" name="provisionPortalUser" defaultChecked className="h-4 w-4" />
              <span>
                Provision {contact.name}{" "}
                <span className="figure text-xs text-muted">{contact.email}</span>
              </span>
            </label>
          ) : (
            <p className="flex h-9 items-center text-sm text-secondary">
              No contact on file — add one to provision access.
            </p>
          )}
        </div>
      </div>

      {jobId === null ? (
        <div className="space-y-3 border-t border-line pt-3">
          <label className="flex items-center gap-2 text-sm text-primary">
            <input
              type="checkbox"
              checked={withJob}
              onChange={(e) => setWithJob(e.target.checked)}
              className="h-4 w-4"
            />
            Open the engagement draft on the marketplace
          </label>
          {withJob ? (
            <>
              <label className="block">
                <span className="eyebrow mb-1.5 block">Title</span>
                <input name="title" type="text" required defaultValue={dealTitle} className={field} />
              </label>
              <label className="block">
                <span className="eyebrow mb-1.5 block">Brief</span>
                <input
                  name="brief"
                  type="text"
                  required
                  placeholder="The one sentence the board card shows"
                  className={field}
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-1.5 block">Description</span>
                <textarea name="description" rows={4} className={`${field} h-auto py-2`} />
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="eyebrow mb-1.5 block">Gross value</span>
                  <p className="figure flex h-9 items-center text-md text-primary">
                    {formatMoney(value)}
                  </p>
                </div>
                <label className="block">
                  <span className="eyebrow mb-1.5 block">Worker pool</span>
                  <input
                    name="workerPool"
                    type="text"
                    required
                    inputMode="decimal"
                    placeholder="From the deal's value"
                    className={`${field} figure`}
                  />
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
              </div>
              <label className="block max-w-56">
                <span className="eyebrow mb-1.5 block">Due date</span>
                <input name="dueAt" type="date" className={`${field} figure`} />
              </label>
            </>
          ) : null}
        </div>
      ) : (
        <p className="border-t border-line pt-3 text-sm text-secondary">
          The engagement is already open — only provisioning re-runs.
        </p>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Converting" : "Convert"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 rounded-s border border-line px-3 text-sm text-secondary hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
