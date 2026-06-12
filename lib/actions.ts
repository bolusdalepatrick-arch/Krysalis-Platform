/** The shared Server Action envelope (PRD section 9). Actions never throw
 *  to the client; `error` is a PRD 5.7-compliant sentence the UI renders
 *  verbatim. */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = void>(error: string): ActionResult<T> {
  return { ok: false, error };
}

/** Fallback copy when an action dies on something we didn't anticipate. */
export const GENERIC_ACTION_ERROR =
  "That didn't complete. Retry in a moment; if it keeps failing, tell an admin.";
