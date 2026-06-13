"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import Eyebrow from "@/components/Eyebrow";

/** Profile tier (PRD 7.9): every role edits their own name and title; email
 *  and role are read-only. */
export default function ProfileSection({
  name,
  title,
  email,
  role,
}: {
  name: string;
  title: string | null;
  email: string;
  role: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfile({
        name: formData.get("name"),
        title: formData.get("title") ?? "",
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const field = "h-10 w-full rounded-s border border-line bg-inset px-3 text-primary";

  return (
    <section className="py-6">
      <Eyebrow as="h2">Profile</Eyebrow>
      <form action={submit} className="mt-3 rounded-m border border-line bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow mb-1.5 block">Name</span>
            <input type="text" name="name" required defaultValue={name} className={field} />
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Title</span>
            <input type="text" name="title" defaultValue={title ?? ""} className={field} />
          </label>
        </div>
        <dl className="mt-6">
          <div className="flex items-baseline justify-between border-t border-line py-3">
            <dt className="eyebrow">Email</dt>
            <dd className="figure text-sm text-secondary">{email}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line py-3">
            <dt className="eyebrow">Role</dt>
            <dd className="figure text-sm text-secondary">{role}</dd>
          </div>
        </dl>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        {saved ? <p className="mt-2 text-sm text-ok">Profile saved.</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-3 h-9 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving" : "Save profile"}
        </button>
      </form>
    </section>
  );
}
