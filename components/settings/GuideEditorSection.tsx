"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishGuide } from "@/app/actions/portal";
import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";

const DRAFT_KEY = "krysalis-guide-draft";

/** Guide editor (PRD 7.9): MODERATOR/ADMIN. A textarea with a live Newsreader
 *  preview, an autosaved local draft, and an explicit Publish. */
export default function GuideEditorSection({ published }: { published: string }) {
  const router = useRouter();
  const [value, setValue] = useState(published);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // Restore an unpublished local draft on mount.
  useEffect(() => {
    const draft = window.localStorage.getItem(DRAFT_KEY);
    if (draft !== null && draft !== published) {
      setValue(draft);
      setRestoredDraft(true);
    }
  }, [published]);

  function onChange(next: string) {
    setValue(next);
    setDone(false);
    window.localStorage.setItem(DRAFT_KEY, next);
  }

  function publish() {
    setError(null);
    startTransition(async () => {
      const result = await publishGuide({ markdown: value });
      if (result.ok) {
        window.localStorage.removeItem(DRAFT_KEY);
        setRestoredDraft(false);
        setDone(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const dirty = value !== published;

  return (
    <section className="py-6">
      <Eyebrow as="h2">Client portal guide</Eyebrow>
      <div className="mt-3 rounded-m border border-line bg-surface p-6">
        <label className="block">
          <span className="eyebrow mb-1.5 block">Guide markdown</span>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={14}
            className="w-full rounded-s border border-line bg-inset p-3 font-mono text-xs text-primary"
          />
        </label>
        {restoredDraft ? (
          <p className="mt-2 text-sm text-warn">Restored an unpublished draft from this browser.</p>
        ) : null}
        <div className="mt-4 rounded-m border border-line bg-base p-6">
          <Eyebrow>Preview</Eyebrow>
          <Markdown className="mt-3">{value}</Markdown>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {done ? <p className="mt-3 text-sm text-ok">Guide published.</p> : null}
        <button
          type="button"
          onClick={publish}
          disabled={pending || !dirty}
          className="mt-4 h-9 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Publishing" : dirty ? "Publish guide" : "Published"}
        </button>
      </div>
    </section>
  );
}
