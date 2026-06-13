import { SIGNATURE_HEADER, signPayload } from "@/lib/hmac";

/** Outbound n8n notifications (PRD 7.12). Mock semantics mirror the gate
 *  repo exactly: MOCK_WEBHOOKS unset means mock everywhere except
 *  production, "true" forces mocks, "false" forces real calls. */

export function webhooksMocked(): boolean {
  const flag = process.env.MOCK_WEBHOOKS;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export interface ClaimNotification {
  bookingId: string;
  claimedBy: { name: string; email: string };
  claimedAt: string;
}

export type DeliveryResult = { delivered: true } | { delivered: false; error: string };

/** POSTs the signed claim notification to n8n so it can swap the meeting
 *  host. In mock mode the signed payload is logged and the call succeeds —
 *  unless the company contains "409", the gate's mock-failure convention
 *  (ruling, pre-M5), which populates `lastWebhookError` so the admin
 *  resend path is demoable offline. Errors are sentences fit for the card. */
export async function deliverClaimNotification(
  payload: ClaimNotification,
  company: string,
): Promise<DeliveryResult> {
  const body = JSON.stringify(payload);
  const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
  const signature = signPayload(body, secret);

  if (webhooksMocked()) {
    if (company.includes("409")) {
      return {
        delivered: false,
        error: 'Mock n8n refused the notification (company contains "409").',
      };
    }
    console.log(`[mock webhook] claim notification signed and delivered: ${body}`);
    return { delivered: true };
  }

  const url = process.env.N8N_CLAIM_WEBHOOK;
  if (!url) {
    return { delivered: false, error: "N8N_CLAIM_WEBHOOK isn't set; the notification wasn't sent." };
  }
  if (!secret) {
    return { delivered: false, error: "N8N_WEBHOOK_SECRET isn't set; the notification wasn't signed." };
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", [SIGNATURE_HEADER]: signature },
      body,
      // A hung n8n endpoint must not stall the claim action after commit.
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return { delivered: false, error: `n8n answered ${response.status} on the claim notification.` };
    }
    return { delivered: true };
  } catch {
    return { delivered: false, error: "Couldn't reach n8n for the claim notification." };
  }
}
