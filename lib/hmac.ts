import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC signing for the n8n bridge (PRD 7.12): hex HMAC-SHA256 of the raw
 *  request body with the shared secret, carried in `X-Krysalis-Signature`.
 *  Mirrors krysalis-gate exactly — same header, same secret, no new deps. */

export const SIGNATURE_HEADER = "X-Krysalis-Signature";

export function signPayload(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/** Timing-safe verification. timingSafeEqual demands equal-length buffers,
 *  so length gates first — that leaks only the length of a hex digest the
 *  caller already knows. Content comparison runs in constant time. */
export function verifySignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = Buffer.from(signPayload(rawBody, secret), "utf8");
  const given = Buffer.from(signature, "utf8");
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}
