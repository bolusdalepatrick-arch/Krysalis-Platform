"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  reorderInfoBar,
  toggleInfoBarMessage,
  upsertInfoBarMessage,
} from "@/app/actions/portal";
import Eyebrow from "@/components/Eyebrow";
import type { InfoBarRow } from "@/lib/queries/settings";

/** Info-bar manager (PRD 7.9): MODERATOR/ADMIN. Reorder, toggle, edit rows,
 *  and add new ones. */
export default function InfoBarSection({ rows }: { rows: InfoBarRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        after?.();
        router.refresh();
      } else {
        setError(result.error ?? "That didn't complete. Retry.");
      }
    });
  }

  const field = "h-9 w-full rounded-s border border-line bg-inset px-3 text-sm text-primary";

  function rowForm(row: InfoBarRow | null) {
    return (
      <form
        action={(formData) =>
          run(
            () =>
              upsertInfoBarMessage({
                id: row?.id ?? "",
                text: formData.get("text"),
                href: formData.get("href") ?? "",
                isActive: formData.get("isActive") === "on",
              }),
            () => {
              setEditing(null);
              setAdding(false);
            },
          )
        }
        className="space-y-3 p-4"
      >
        <label className="block">
          <span className="eyebrow mb-1.5 block">Text</span>
          <input name="text" type="text" required defaultValue={row?.text ?? ""} className={field} />
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Link (optional)</span>
          <input
            name="href"
            type="url"
            defaultValue={row?.href ?? ""}
            placeholder="https://"
            className={`${field} figure`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-primary">
          <input name="isActive" type="checkbox" defaultChecked={row?.isActive ?? true} className="h-4 w-4" />
          Active
        </label>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
          >
            {row ? "Save" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setAdding(false);
            }}
            className="h-8 rounded-s border border-line px-2.5 text-sm text-secondary hover:text-primary"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <section className="py-6">
      <Eyebrow as="h2">Info bar</Eyebrow>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-3 overflow-hidden rounded-m border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong">
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">Order</Eyebrow>
              <Eyebrow as="th" className="h-9 w-full px-4 text-left font-normal">Text</Eyebrow>
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">Active</Eyebrow>
              <th className="h-9 px-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-b border-line last:border-b-0 align-top">
                {editing === row.id ? (
                  <td colSpan={4}>{rowForm(row)}</td>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={pending || i === 0}
                          onClick={() => run(() => reorderInfoBar({ id: row.id, direction: "up" }))}
                          className="text-muted hover:text-primary disabled:opacity-30"
                        >
                          <ChevronUp size={16} strokeWidth={1.5} aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={pending || i === rows.length - 1}
                          onClick={() => run(() => reorderInfoBar({ id: row.id, direction: "down" }))}
                          className="text-muted hover:text-primary disabled:opacity-30"
                        >
                          <ChevronDown size={16} strokeWidth={1.5} aria-hidden />
                        </button>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary">{row.text}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-pressed={row.isActive}
                        disabled={pending}
                        onClick={() => run(() => toggleInfoBarMessage({ id: row.id }))}
                        className="inline-flex items-center gap-1 disabled:opacity-60"
                      >
                        {row.isActive ? (
                          <>
                            <Check size={16} strokeWidth={1.5} className="text-ok" aria-hidden />
                            <span className="figure text-2xs uppercase tracking-[0.08em] text-ok">On</span>
                          </>
                        ) : (
                          <span className="figure text-2xs uppercase tracking-[0.08em] text-muted">Off</span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(row.id)}
                        className="text-sm text-accent hover:underline underline-offset-2"
                      >
                        Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding ? (
        <div className="mt-3 rounded-m border border-line bg-surface">{rowForm(null)}</div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 h-9 rounded-s border border-line px-4 text-sm text-secondary hover:text-primary"
        >
          Add announcement
        </button>
      )}
    </section>
  );
}
