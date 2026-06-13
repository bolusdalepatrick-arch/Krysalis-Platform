"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";

/** First-week step 1, editable inline (PRD 7.13): name and title on the
 *  profile. The step is done once both are present; the form stays available
 *  to correct them. */
export default function InlineEntry({
  name,
  title,
  done,
}: {
  name: string;
  title: string | null;
  done: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!done);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({
        name: formData.get("name"),
        title: formData.get("title") ?? "",
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
      <p className="mt-1 text-sm text-secondary">
        {name}
        {title ? ` · ${title}` : ""}{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-accent underline-offset-2 hover:underline"
        >
          Edit
        </button>
      </p>
    );
  }

  const field =
    "h-9 w-full rounded-s border border-line bg-inset px-3 text-md text-primary placeholder:text-muted";

  return (
    <form action={submit} className="mt-2 max-w-md space-y-2">
      <label className="block">
        <span className="eyebrow mb-1 block">Name</span>
        <input name="name" type="text" required defaultValue={name} className={field} />
      </label>
      <label className="block">
        <span className="eyebrow mb-1 block">Title</span>
        <input
          name="title"
          type="text"
          required
          defaultValue={title ?? ""}
          placeholder="e.g. Junior Designer"
          className={field}
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving" : "Save"}
        </button>
        {done ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-8 rounded-s border border-line px-2.5 text-sm text-secondary hover:text-primary"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
