"use client";

import { useState, useTransition } from "react";
import { enrollInCourse } from "@/app/actions/academy";

/** Enroll control on the classroom header (PRD 7.2). */
export default function EnrollButton({ courseId }: { courseId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await enrollInCourse({ courseId });
            if (!result.ok) setError(result.error);
          });
        }}
        className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        Enroll
      </button>
    </div>
  );
}
