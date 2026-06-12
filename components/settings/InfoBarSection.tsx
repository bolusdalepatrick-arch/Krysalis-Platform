import { Check } from "lucide-react";
import Eyebrow from "@/components/Eyebrow";
import { INFO_BAR_MESSAGES } from "@/lib/mock";

/** Info-bar manager tier (PRD 7.9): MODERATOR and ADMIN. Reorder, toggle,
 *  and edit land with the portal-content tables (M7). */
export default function InfoBarSection() {
  return (
    <section className="py-6">
      <Eyebrow as="h2">Info bar</Eyebrow>
      <div className="mt-3 overflow-hidden rounded-m border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong">
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">
                Order
              </Eyebrow>
              <Eyebrow as="th" className="h-9 w-full px-4 text-left font-normal">
                Text
              </Eyebrow>
              <Eyebrow as="th" className="h-9 px-4 text-left font-normal">
                Active
              </Eyebrow>
              <th className="h-9 px-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {INFO_BAR_MESSAGES.map((message) => (
              <tr key={message.id} className="h-9 border-b border-line last:border-b-0">
                <td className="figure px-4">{message.order}</td>
                <td className="px-4">{message.text}</td>
                <td className="px-4">
                  {message.isActive ? (
                    <Check size={16} strokeWidth={1.5} aria-label="Active" className="text-ok" />
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 text-right">
                  <button
                    type="button"
                    disabled
                    className="text-sm text-accent disabled:opacity-60"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
