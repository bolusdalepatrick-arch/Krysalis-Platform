"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/app/actions/marketplace";
import Eyebrow from "@/components/Eyebrow";
import { formatMoney } from "@/lib/format";

interface Option {
  id: string;
  name: string;
}

/** Admin-only create-job panel on the board (PRD 7.1). Margin derives from
 *  gross minus pool and is shown before submitting — never hidden. */
export default function NewPostingPanel({
  accounts,
  departments,
}: {
  accounts: Option[];
  departments: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [gross, setGross] = useState("");
  const [pool, setPool] = useState("");

  const margin =
    gross && pool && !Number.isNaN(Number(gross)) && !Number.isNaN(Number(pool))
      ? (Number(gross) - Number(pool)).toFixed(2)
      : null;

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createJob({
        title: formData.get("title"),
        brief: formData.get("brief"),
        description: formData.get("description") ?? "",
        accountId: formData.get("accountId"),
        departmentId: formData.get("departmentId"),
        grossValue: formData.get("grossValue"),
        workerPool: formData.get("workerPool"),
        dueAt: formData.get("dueAt") ?? "",
      });
      if (result.ok) {
        router.push(`/dashboard/marketplace/${result.data.jobId}`);
      } else {
        setError(result.error);
      }
    });
  }

  const field = "h-9 w-full rounded-s border border-line bg-inset px-3 text-md text-primary placeholder:text-muted";

  return (
    <div className="border-b border-line px-6 py-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover"
        >
          New posting
        </button>
      ) : (
        <form action={submit} className="max-w-2xl space-y-4">
          <Eyebrow as="h2">New posting</Eyebrow>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Title</span>
            <input name="title" type="text" required className={field} />
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
            <textarea name="description" rows={5} className={`${field} h-auto py-2`} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="eyebrow mb-1.5 block">Client account</span>
              <select name="accountId" required className={field}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
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
          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="eyebrow mb-1.5 block">Gross value</span>
              <input
                name="grossValue"
                type="text"
                required
                inputMode="decimal"
                value={gross}
                onChange={(e) => setGross(e.target.value)}
                placeholder="6500.00"
                className={`${field} figure`}
              />
            </label>
            <label className="block">
              <span className="eyebrow mb-1.5 block">Worker pool</span>
              <input
                name="workerPool"
                type="text"
                required
                inputMode="decimal"
                value={pool}
                onChange={(e) => setPool(e.target.value)}
                placeholder="4200.00"
                className={`${field} figure`}
              />
            </label>
            <div>
              <span className="eyebrow mb-1.5 block">Margin</span>
              <p className="figure flex h-9 items-center text-md text-primary">
                {margin ? formatMoney(margin) : "—"}
              </p>
            </div>
          </div>
          <label className="block max-w-56">
            <span className="eyebrow mb-1.5 block">Due date</span>
            <input name="dueAt" type="date" className={`${field} figure`} />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
            >
              {pending ? "Posting" : "Post to the board"}
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
      )}
    </div>
  );
}
