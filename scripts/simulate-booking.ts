/**
 * `npm run simulate:booking` (PRD 7.12): signs the section 7.12 sample
 * payload with N8N_WEBHOOK_SECRET and POSTs it to the local webhook — the
 * entire loop, card to claim to deal, with no n8n anywhere. Idempotent by
 * design: the fixed bookingId upserts, so running it twice yields one card.
 */
import { readFileSync } from "node:fs";
import { SIGNATURE_HEADER, signPayload } from "../lib/hmac";

/** Minimal .env reader — process.loadEnvFile needs Node 20.12+ while the
 *  repo's floor is 20.9, so the file is parsed by hand. */
function loadEnv(path: string): boolean {
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const match = /^\s*([A-Z][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/.exec(line);
      if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
    }
    return true;
  } catch {
    return false;
  }
}

if (!process.env.N8N_WEBHOOK_SECRET) {
  // No .env yet — fall back to the committed example so a fresh clone can
  // still drive the loop (its dev placeholder matches the server's).
  if (!loadEnv(".env")) loadEnv(".env.example");
}

const secret = process.env.N8N_WEBHOOK_SECRET;
if (!secret) {
  console.error("N8N_WEBHOOK_SECRET is not set. Copy .env.example to .env and retry.");
  process.exit(1);
}

// The PRD section 7.12 sample, verbatim. Same company as the seeded
// unclaimed card — claiming both demonstrates the case-insensitive
// account find-or-create on a repeat visitor.
const payload = {
  bookingId: "bk_8f31c2",
  slotStart: "2026-06-18T15:00:00.000Z",
  slotEnd: "2026-06-18T15:30:00.000Z",
  name: "Rosa Calloway",
  email: "rosa@halcyondental.com",
  company: "Halcyon Dental Partners",
  companySize: "11-50",
  automationGoal:
    "Front desk spends two hours a day on appointment reminders and reschedules.",
  submittedAt: "2026-06-12T09:14:00.000Z",
};

const url =
  process.env.SIMULATE_BOOKING_URL ??
  `http://localhost:${process.env.PORT ?? "3000"}/api/hooks/booking`;
const body = JSON.stringify(payload);

async function main() {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [SIGNATURE_HEADER]: signPayload(body, secret!),
      },
      body,
    });
  } catch {
    console.error(`Couldn't reach ${url}. Start the dev server first: npm run dev`);
    process.exit(1);
  }
  const text = await response.text();
  console.log(`${response.status} ${url}`);
  console.log(text);
  if (response.ok) {
    console.log(
      "Card delivered. See #new-business or /dashboard/crm/bounties — the 5s poll carries it to open windows.",
    );
  } else {
    process.exit(1);
  }
}

void main();
