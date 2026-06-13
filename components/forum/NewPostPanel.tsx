"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createForumPost } from "@/app/actions/forum";
import Eyebrow from "@/components/Eyebrow";
import { useToast } from "@/components/toast/ToastProvider";

/** New forum post (PRD 7.4): optional title, optional department tag, plain
 *  body. Posting awards capped XP. */
export default function NewPostPanel({
  departments,
}: {
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createForumPost({
        title: formData.get("title") ?? "",
        body: formData.get("body"),
        departmentId: formData.get("departmentId") ?? "",
      });
      if (result.ok) {
        if (result.data.tierUp) {
          push(`Tier ${result.data.tierUp.level} — ${result.data.tierUp.name}`, "gold");
        }
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const field =
    "w-full rounded-s border border-line bg-inset px-3 text-md text-primary placeholder:text-muted";

  if (!open) {
    return (
      <div className="border-b border-line px-6 py-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover"
        >
          New post
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-line px-6 py-4">
      <form ref={formRef} action={submit} className="max-w-2xl space-y-3">
        <Eyebrow as="h2">New post</Eyebrow>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Title (optional)</span>
          <input name="title" type="text" className={`${field} h-9`} />
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Post</span>
          <textarea name="body" required rows={4} className={`${field} resize-none py-2`} />
        </label>
        <label className="block max-w-xs">
          <span className="eyebrow mb-1.5 block">Department tag (optional)</span>
          <select name="departmentId" defaultValue="" className={`${field} h-9`}>
            <option value="">No tag</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Posting" : "Post"}
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
