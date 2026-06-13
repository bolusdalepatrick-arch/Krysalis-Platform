"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addVaultAsset } from "@/app/actions/vault";
import Eyebrow from "@/components/Eyebrow";

const FILE_TYPES = ["pdf", "doc", "sheet", "image", "figma", "link"] as const;

/** Add a vault asset (PRD 7.5): metadata + an external URL. The form states
 *  plainly that file storage is V3. */
export default function AddAssetPanel({ jobs }: { jobs: { id: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addVaultAsset({
        title: formData.get("title"),
        fileUrl: formData.get("fileUrl"),
        fileType: formData.get("fileType"),
        jobId: formData.get("jobId") ?? "",
        sizeKb: formData.get("sizeKb") ?? "",
      });
      if (result.ok) {
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
      <div className="border-b border-line px-6 py-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover"
        >
          Add asset
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-line px-6 py-4">
      <form action={submit} className="max-w-2xl space-y-4">
        <Eyebrow as="h2">Add asset</Eyebrow>
        <p className="text-sm text-secondary">
          File storage lands in V3. For now this records the asset&apos;s metadata
          and an external link.
        </p>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Title</span>
          <input name="title" type="text" required className={field} />
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block">URL</span>
          <input name="fileUrl" type="url" required placeholder="https://" className={`${field} figure`} />
        </label>
        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="eyebrow mb-1.5 block">Type</span>
            <select name="fileType" required defaultValue="doc" className={field}>
              {FILE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Size (KB)</span>
            <input
              name="sizeKb"
              type="text"
              inputMode="numeric"
              placeholder="Optional"
              className={`${field} figure`}
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Job</span>
            <select name="jobId" defaultValue="" className={field}>
              <option value="">No job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Filing" : "File asset"}
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
