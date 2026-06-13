import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { SIGNATURE_HEADER, verifySignature } from "@/lib/hmac";
import { bookingPayloadSchema } from "@/lib/validators";

/** The one route handler in the app (PRD 7.12): n8n relays a confirmed
 *  website booking. Third parties cannot invoke Server Actions, so this is
 *  the single front door — HMAC-verified against the raw body before
 *  anything else runs, idempotent on n8n retries via the externalRef
 *  upsert. The card posts to #new-business under the Gate persona. */

const GATE_USER_ID = "u-gate";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
  if (!verifySignature(rawBody, request.headers.get(SIGNATURE_HEADER), secret)) {
    return NextResponse.json({ ok: false, error: "Bad signature." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Body is not JSON." }, { status: 422 });
  }
  const parsed = bookingPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Payload is incomplete." },
      { status: 422 },
    );
  }
  const booking = parsed.data;

  try {
    const channelId = await prisma.$transaction(async (tx) => {
      // Idempotent on externalRef: a retried relay updates the visitor's
      // fields and touches nothing about claim state.
      const card = await tx.bookingCard.upsert({
        where: { externalRef: booking.bookingId },
        update: {
          name: booking.name,
          email: booking.email,
          company: booking.company,
          companySize: booking.companySize,
          automationGoal: booking.automationGoal,
          slotStart: new Date(booking.slotStart),
          slotEnd: new Date(booking.slotEnd),
          submittedAt: new Date(booking.submittedAt),
        },
        create: {
          externalRef: booking.bookingId,
          name: booking.name,
          email: booking.email,
          company: booking.company,
          companySize: booking.companySize,
          automationGoal: booking.automationGoal,
          slotStart: new Date(booking.slotStart),
          slotEnd: new Date(booking.slotEnd),
          submittedAt: new Date(booking.submittedAt),
        },
      });

      const board = await tx.channel.findFirst({
        where: { kind: "FIRM", name: "new-business" },
        select: { id: true },
      });
      if (!board) throw new Error("The #new-business channel is missing. Reseed the database.");

      // Message.bookingCardId is unique — the retry path lands on the
      // existing inline card instead of posting it twice. The message is
      // stamped now, not submittedAt: the 5s poll cursor only looks
      // forward, so a backdated message would never reach open windows
      // (the same reasoning as approveShadowDraft's re-timestamp). The
      // card row keeps the visitor's submittedAt.
      await tx.message.upsert({
        where: { bookingCardId: card.id },
        update: {},
        create: {
          channelId: board.id,
          senderId: GATE_USER_ID,
          body: "Discovery call booked from the website.",
          bookingCardId: card.id,
        },
      });
      return board.id;
    });

    revalidatePath(`/dashboard/channels/${channelId}`);
    revalidatePath("/dashboard/crm/bounties");
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "The booking couldn't be stored. Check the server logs." },
      { status: 500 },
    );
  }
}
