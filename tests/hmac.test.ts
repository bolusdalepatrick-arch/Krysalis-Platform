/** lib/hmac.ts (PRD section 12): sign/verify round-trip, tampered body
 *  rejected, and the comparison runs through timingSafeEqual. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SIGNATURE_HEADER, signPayload, verifySignature } from "@/lib/hmac";

const SECRET = "dev-not-a-secret";
const BODY = JSON.stringify({ bookingId: "bk_8f31c2", company: "Halcyon Dental Partners" });

describe("hmac sign and verify", () => {
  it("round-trips: a body verifies against its own signature", () => {
    const signature = signPayload(BODY, SECRET);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(verifySignature(BODY, signature, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const signature = signPayload(BODY, SECRET);
    expect(verifySignature(BODY.replace("Halcyon", "Halcyox"), signature, SECRET)).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const signature = signPayload(BODY, "some-other-secret");
    expect(verifySignature(BODY, signature, SECRET)).toBe(false);
  });

  it("rejects missing, truncated, and padded signatures", () => {
    const signature = signPayload(BODY, SECRET);
    expect(verifySignature(BODY, null, SECRET)).toBe(false);
    expect(verifySignature(BODY, "", SECRET)).toBe(false);
    expect(verifySignature(BODY, signature.slice(0, 63), SECRET)).toBe(false);
    expect(verifySignature(BODY, `${signature}0`, SECRET)).toBe(false);
  });

  it("rejects everything when the secret is empty", () => {
    const signature = signPayload(BODY, "");
    expect(verifySignature(BODY, signature, "")).toBe(false);
  });

  it("is deterministic for the same input", () => {
    expect(signPayload(BODY, SECRET)).toBe(signPayload(BODY, SECRET));
  });

  it("carries the gate's header name", () => {
    expect(SIGNATURE_HEADER).toBe("X-Krysalis-Signature");
  });

  it("compares through node:crypto timingSafeEqual, not ===", () => {
    const source = readFileSync(new URL("../lib/hmac.ts", import.meta.url), "utf8");
    expect(source).toContain("timingSafeEqual(");
    expect(source).not.toMatch(/expected\s*===?\s*given/);
  });
});
