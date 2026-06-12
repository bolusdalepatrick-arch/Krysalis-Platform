import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import { PORTAL_GUIDE_MD } from "@/lib/mock";

/** Guide editor tier (PRD 7.9): MODERATOR and ADMIN. The textarea and
 *  publish action go live with the portal-content tables (M7). */
export default function GuideEditorSection() {
  return (
    <section className="py-6">
      <Eyebrow as="h2">Client portal guide</Eyebrow>
      <div className="mt-3 rounded-m border border-line bg-surface p-6">
        <label className="block">
          <span className="eyebrow mb-1.5 block">Guide markdown</span>
          <textarea
            name="guide"
            disabled
            rows={14}
            defaultValue={PORTAL_GUIDE_MD}
            className="w-full rounded-s border border-line bg-inset p-3 font-mono text-xs disabled:text-secondary"
          />
        </label>
        <div className="mt-4 rounded-m border border-line bg-base p-6">
          <Eyebrow>Preview</Eyebrow>
          <Markdown className="mt-3">{PORTAL_GUIDE_MD}</Markdown>
        </div>
        <button
          type="button"
          disabled
          className="mt-4 h-9 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-60"
        >
          Publish guide
        </button>
      </div>
    </section>
  );
}
