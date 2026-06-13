"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logDealActivity } from "@/app/actions/crm";

const KINDS = [
  { value: "NOTE", label: "Note" },
  { value: "CALL", label: "Call" },
  { value: "EMAIL", label: "Email" },
  { value: "MEETING", label: "Meeting" },
] as const;

/** The activity composer (PRD 7.11): NOTE / CALL / EMAIL / MEETING.
 *  STAGE_CHANGE is the machine's — it never appears here. */
export default function ActivityComposer({ dealId }: { dealId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await logDealActivity({
        dealId,
        kind: formData.get("kind"),
        body: formData.get("body"),
      });
      if (result.ok) {
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form ref={formRef} action={submit} className="rounded-m border border-line bg-raised p-3">
      <label className="block">
        <span className="sr-only">Activity entry</span>
        <textarea
          name="body"
          required
          rows={3}
          placeholder="Log a call, an email, a meeting, or a note"
          className="w-full resize-none rounded-s border border-line bg-inset px-3 py-2 text-sm text-primary placeholder:text-muted"
        />
      </label>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-2 flex items-center justify-end gap-2">
        <label>
          <span className="sr-only">Kind</span>
          <select
            name="kind"
            defaultValue="NOTE"
            className="h-8 rounded-s border border-line bg-inset px-2 text-sm text-primary"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Logging" : "Log activity"}
        </button>
      </div>
    </form>
  );
}
