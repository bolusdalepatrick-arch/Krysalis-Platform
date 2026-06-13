"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replyToPost } from "@/app/actions/forum";
import { useToast } from "@/components/toast/ToastProvider";

/** Reply composer (PRD 7.4): one level deep, opens inline under a post. */
export default function ReplyComposer({ parentId }: { parentId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await replyToPost({ parentId, body: formData.get("body") });
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-xs text-accent underline-offset-2 hover:underline"
      >
        Reply
      </button>
    );
  }

  return (
    <form ref={formRef} action={submit} className="mt-3 space-y-2">
      <label className="block">
        <span className="sr-only">Reply</span>
        <textarea
          name="body"
          required
          rows={2}
          placeholder="Write a reply"
          className="w-full resize-none rounded-s border border-line bg-inset px-3 py-2 text-sm text-primary placeholder:text-muted"
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Posting" : "Post reply"}
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
