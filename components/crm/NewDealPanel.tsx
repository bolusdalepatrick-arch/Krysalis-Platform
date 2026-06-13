"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDeal } from "@/app/actions/crm";
import Eyebrow from "@/components/Eyebrow";

/** Manual pipeline entry (PRD 7.11): an existing account or a new account
 *  name + contact — the pipeline is never hostage to the webhook. */
export default function NewDealPanel({
  accounts,
}: {
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newAccount, setNewAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createDeal({
        accountId: newAccount ? "" : formData.get("accountId"),
        newAccountName: newAccount ? formData.get("newAccountName") : "",
        contactName: newAccount ? formData.get("contactName") : "",
        contactEmail: newAccount ? formData.get("contactEmail") : "",
        title: formData.get("title"),
        source: formData.get("source"),
        value: formData.get("value") ?? "",
        expectedCloseAt: formData.get("expectedCloseAt") ?? "",
      });
      if (result.ok) {
        router.push(`/dashboard/crm/deals/${result.data.dealId}`);
      } else {
        setError(result.error);
      }
    });
  }

  const field =
    "h-9 w-full rounded-s border border-line bg-inset px-3 text-md text-primary placeholder:text-muted";

  if (!open) {
    return (
      <div className="border-b border-line px-6 py-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover"
        >
          New deal
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-line px-6 py-4">
      <form action={submit} className="max-w-2xl space-y-4">
        <Eyebrow as="h2">New deal</Eyebrow>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Title</span>
          <input name="title" type="text" required className={field} />
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-primary">
              <input
                type="radio"
                name="accountMode"
                checked={!newAccount}
                onChange={() => setNewAccount(false)}
                className="h-4 w-4"
              />
              Existing account
            </label>
            <label className="flex items-center gap-2 text-sm text-primary">
              <input
                type="radio"
                name="accountMode"
                checked={newAccount}
                onChange={() => setNewAccount(true)}
                className="h-4 w-4"
              />
              New account
            </label>
          </div>
          {!newAccount ? (
            <label className="block">
              <span className="eyebrow mb-1.5 block">Account</span>
              <select name="accountId" required className={field}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="eyebrow mb-1.5 block">Account name</span>
                <input name="newAccountName" type="text" required className={field} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="eyebrow mb-1.5 block">Contact name</span>
                  <input name="contactName" type="text" required className={field} />
                </label>
                <label className="block">
                  <span className="eyebrow mb-1.5 block">Contact email</span>
                  <input name="contactEmail" type="email" required className={field} />
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="eyebrow mb-1.5 block">Source</span>
            <select name="source" required className={field}>
              <option value="REFERRAL">Referral</option>
              <option value="OUTBOUND">Outbound</option>
              <option value="EVENT">Event</option>
            </select>
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Value</span>
            <input
              name="value"
              type="text"
              inputMode="decimal"
              placeholder="Optional"
              className={`${field} figure`}
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Expected close</span>
            <input name="expectedCloseAt" type="date" className={`${field} figure`} />
          </label>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Opening" : "Open deal"}
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
    </div>
  );
}
