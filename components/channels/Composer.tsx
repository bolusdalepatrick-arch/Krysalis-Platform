/** The channel composer (PRD 7.3), pinned after the thread. Sending posts a
 *  message and lands with the database (M2+). */
export default function Composer({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-m border border-line bg-raised p-2">
      <input
        type="text"
        disabled
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 min-w-0 flex-1 bg-transparent px-2 text-md text-primary placeholder:text-muted"
      />
      <button
        type="button"
        disabled
        className="h-8 shrink-0 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-60"
      >
        Send
      </button>
    </div>
  );
}
