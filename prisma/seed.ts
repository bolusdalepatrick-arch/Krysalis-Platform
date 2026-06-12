/**
 * Deterministic seed (PRD section 10). Wipes and rewrites the database from
 * prisma/seed-data.ts: same data every run, idempotent on reset. The Shadow
 * draft is generated at seed time by the deterministic agent, and every
 * user's XP, tier, and earnings are computed from the ledger this writes —
 * never asserted.
 */
import { PrismaClient, Prisma, type XpReason } from "@prisma/client";
import { XP_AMOUNTS, tierForXp } from "../lib/xp";
import { validateJobMoney } from "../lib/money";
import {
  ACCOUNTS,
  BIDS,
  BOOKING_CARDS,
  CHANNELS,
  COMPLETIONS,
  DEALS,
  DEPARTMENTS,
  INFO_BAR,
  JOBS,
  PORTAL_GUIDE_MD,
  USERS,
  allForumPosts,
  allVaultAssets,
  buildMessages,
  coursesWithBodies,
  jobDescription,
} from "./seed-data";

const prisma = new PrismaClient();

const d = (iso: string) => new Date(iso);
const DAY = 86_400_000;
const addDays = (iso: string, days: number) => new Date(d(iso).getTime() + days * DAY);

interface LedgerEntry {
  userId: string;
  amount: number;
  reason: XpReason;
  refId: string | null;
  createdAt: Date;
}

function buildLedger(): LedgerEntry[] {
  const events: LedgerEntry[] = [];
  const courses = coursesWithBodies();

  // Onboarding (PRD 7.13) — everyone stamped except Noor.
  for (const user of USERS) {
    if (user.onboardingCompletedAt) {
      events.push({
        userId: user.id,
        amount: XP_AMOUNTS.ONBOARDING_COMPLETED,
        reason: "ONBOARDING_COMPLETED",
        refId: null,
        createdAt: d(user.onboardingCompletedAt),
      });
    }
  }

  // Pre-platform history (the firm has used its own platform since early
  // 2025; the visible jobs cover only the last five months). refId null.
  for (const user of USERS) {
    const { jobs, courses: histCourses, lessons, earnings } = user.history;
    void earnings;
    const start = addDays(user.createdAt, 21).getTime();
    const end = d("2026-01-10T12:00:00").getTime();
    const spread = (i: number, n: number) =>
      new Date(n <= 1 ? start : start + ((end - start) * i) / (n - 1));
    for (let i = 0; i < jobs; i++) {
      events.push({ userId: user.id, amount: XP_AMOUNTS.JOB_COMPLETED, reason: "JOB_COMPLETED", refId: null, createdAt: spread(i, jobs) });
    }
    for (let i = 0; i < histCourses; i++) {
      events.push({ userId: user.id, amount: XP_AMOUNTS.COURSE_COMPLETED, reason: "COURSE_COMPLETED", refId: null, createdAt: spread(i, histCourses) });
    }
    for (let i = 0; i < lessons; i++) {
      events.push({ userId: user.id, amount: XP_AMOUNTS.LESSON_COMPLETED, reason: "LESSON_COMPLETED", refId: null, createdAt: spread(i, lessons) });
    }
  }

  // Current-course completions (refIds point at real rows).
  for (const completion of COMPLETIONS) {
    const course = courses.find((c) => c.id === completion.courseId);
    if (!course) throw new Error(`Unknown course ${completion.courseId}`);
    const lessons = course.modules.flatMap((m) => m.lessons);
    const done = lessons.slice(0, completion.lessons);
    done.forEach((lesson, i) => {
      events.push({
        userId: completion.memberId,
        amount: XP_AMOUNTS.LESSON_COMPLETED,
        reason: "LESSON_COMPLETED",
        refId: lesson.id,
        createdAt: addDays(completion.startedAt, i * 2),
      });
    });
    if (completion.lessons >= lessons.length) {
      events.push({
        userId: completion.memberId,
        amount: XP_AMOUNTS.COURSE_COMPLETED,
        reason: "COURSE_COMPLETED",
        refId: course.id,
        createdAt: addDays(completion.startedAt, (lessons.length - 1) * 2),
      });
    }
  }

  // Accepted bids and completed jobs.
  for (const bid of BIDS) {
    if (bid.status === "ACCEPTED") {
      events.push({
        userId: bid.memberId,
        amount: XP_AMOUNTS.BID_ACCEPTED,
        reason: "BID_ACCEPTED",
        refId: bid.id,
        createdAt: addDays(bid.createdAt, 1),
      });
    }
  }
  for (const job of JOBS) {
    if (job.status === "COMPLETED" && job.completedAt) {
      for (const workerId of job.workerIds) {
        events.push({
          userId: workerId,
          amount: XP_AMOUNTS.JOB_COMPLETED,
          reason: "JOB_COMPLETED",
          refId: job.id,
          createdAt: d(`${job.completedAt}T17:00:00`),
        });
      }
    }
  }

  // Won deals.
  for (const deal of DEALS) {
    if (deal.stage === "WON" && deal.wonAt) {
      events.push({
        userId: deal.ownerId,
        amount: XP_AMOUNTS.DEAL_WON,
        reason: "DEAL_WON",
        refId: deal.id,
        createdAt: d(`${deal.wonAt}T10:08:00`),
      });
    }
  }

  // Forum posts and replies — 5 XP, capped per author per day (PRD 7.2).
  const forumByAuthorDay = new Map<string, number>();
  const forumEvents: { userId: string; refId: string; at: string }[] = [];
  for (const post of allForumPosts()) {
    forumEvents.push({ userId: post.authorId, refId: post.id, at: post.at });
    for (const reply of post.replies) {
      forumEvents.push({ userId: reply.authorId, refId: reply.id, at: reply.at });
    }
  }
  for (const fe of forumEvents.sort((a, b) => a.at.localeCompare(b.at))) {
    const key = `${fe.userId}:${fe.at.slice(0, 10)}`;
    const awarded = forumByAuthorDay.get(key) ?? 0;
    if (awarded + XP_AMOUNTS.FORUM_POST > 25) continue;
    forumByAuthorDay.set(key, awarded + XP_AMOUNTS.FORUM_POST);
    events.push({
      userId: fe.userId,
      amount: XP_AMOUNTS.FORUM_POST,
      reason: "FORUM_POST",
      refId: fe.refId,
      createdAt: d(fe.at),
    });
  }

  return events;
}

async function wipe() {
  // Children before parents; SetNull relations untangle themselves.
  await prisma.xpEvent.deleteMany();
  await prisma.lessonCompletion.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.jobMember.deleteMany();
  await prisma.vaultAsset.deleteMany();
  await prisma.bookingCard.deleteMany();
  await prisma.job.deleteMany();
  await prisma.dealActivity.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.portalGuide.deleteMany();
  await prisma.infoBarMessage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.account.deleteMany();
  await prisma.department.deleteMany();
}

async function main() {
  // Fail fast if any authored job breaks the money invariant (PRD 7.1).
  for (const job of JOBS) {
    const problem = validateJobMoney(job.grossValue, job.workerPool, job.firmMargin);
    if (problem) throw new Error(`${job.id}: ${problem}`);
  }

  await wipe();

  await prisma.department.createMany({
    data: DEPARTMENTS.map(({ id, name, description }) => ({
      id,
      name,
      slug: id,
      description,
    })),
  });

  // An account exists from its first recorded touch: its earliest deal or
  // booking card, else the firm's pre-window history.
  const accountCreatedAt = (accountId: string, accountName: string): Date => {
    const candidates = [
      ...DEALS.filter((deal) => deal.accountId === accountId).map((deal) =>
        d(`${deal.createdAt}T09:00:00`).getTime(),
      ),
      ...BOOKING_CARDS.filter((card) => card.company === accountName).map((card) =>
        d(card.submittedAt).getTime(),
      ),
    ];
    return candidates.length > 0
      ? new Date(Math.min(...candidates))
      : d("2025-06-02T09:00:00");
  };

  await prisma.account.createMany({
    data: ACCOUNTS.map((a) => ({
      id: a.id,
      name: a.name,
      kind: a.kind,
      website: a.website ?? null,
      status: a.status,
      notes: a.notes,
      createdAt: accountCreatedAt(a.id, a.name),
    })),
  });

  await prisma.contact.createMany({
    data: ACCOUNTS.flatMap((a) =>
      a.contacts.map((c, i) => ({
        id: `c-${a.id.replace(/^a-/, "")}-${i + 1}`,
        accountId: a.id,
        name: c.name,
        email: c.email,
        title: c.title ?? null,
        isPrimary: c.isPrimary ?? false,
      })),
    ),
  });

  await prisma.user.createMany({
    data: USERS.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      title: u.title || null,
      role: u.role,
      isSystem: u.isSystem ?? false,
      departmentId: u.departmentId,
      accountId: u.accountId ?? null,
      createdAt: d(u.createdAt),
      onboardingCompletedAt: u.onboardingCompletedAt ? d(u.onboardingCompletedAt) : null,
      portalStartDismissedAt: u.portalStartDismissedAt ? d(u.portalStartDismissedAt) : null,
      detailsConfirmedAt: u.detailsConfirmedAt ? d(u.detailsConfirmedAt) : null,
    })),
  });

  // Courses, modules, lessons — then the department primer pointers.
  const courses = coursesWithBodies();
  for (const course of courses) {
    await prisma.course.create({
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        departmentId: course.departmentId,
      },
    });
    let order = 0;
    for (const [mi, module] of course.modules.entries()) {
      await prisma.module.create({
        data: { id: module.id, title: module.title, order: mi + 1, courseId: course.id },
      });
      await prisma.lesson.createMany({
        data: module.lessons.map((lesson) => {
          order += 1;
          return {
            id: lesson.id,
            title: lesson.title,
            order,
            body: lesson.body ?? "",
            durationMin: lesson.durationMin ?? null,
            moduleId: module.id,
          };
        }),
      });
    }
  }
  for (const dept of DEPARTMENTS) {
    await prisma.department.update({
      where: { id: dept.id },
      data: { onboardingCourseId: dept.onboardingCourseId },
    });
  }

  // Enrollments and lesson completions from the matrix.
  for (const completion of COMPLETIONS) {
    const course = courses.find((c) => c.id === completion.courseId);
    if (!course) continue;
    const lessons = course.modules.flatMap((m) => m.lessons);
    const done = lessons.slice(0, completion.lessons);
    await prisma.enrollment.create({
      data: {
        id: `e-${completion.memberId.replace(/^u-/, "")}-${course.id.replace(/^c-/, "")}`,
        memberId: completion.memberId,
        courseId: course.id,
        progressPct: Math.round((done.length / lessons.length) * 100),
        isCompleted: done.length === lessons.length,
      },
    });
    await prisma.lessonCompletion.createMany({
      data: done.map((lesson, i) => ({
        memberId: completion.memberId,
        lessonId: lesson.id,
        completedAt: addDays(completion.startedAt, i * 2),
      })),
    });
  }

  // Pipeline.
  for (const deal of DEALS) {
    await prisma.deal.create({
      data: {
        id: deal.id,
        title: deal.title,
        accountId: deal.accountId,
        ownerId: deal.ownerId,
        stage: deal.stage,
        source: deal.source,
        value: deal.value != null ? new Prisma.Decimal(deal.value) : null,
        expectedCloseAt: deal.expectedCloseAt ? d(`${deal.expectedCloseAt}T17:00:00`) : null,
        wonAt: deal.wonAt ? d(`${deal.wonAt}T10:08:00`) : null,
        lostAt: deal.lostAt ? d(`${deal.lostAt}T11:42:00`) : null,
        lostReason: deal.lostReason ?? null,
        // Deals opened from a claimed booking card exist from the claim
        // itself (PRD 7.12); manual deals from the working morning.
        createdAt: (() => {
          const card = BOOKING_CARDS.find((c) => c.dealId === deal.id);
          return card?.claimedAt ? d(card.claimedAt) : d(`${deal.createdAt}T09:00:00`);
        })(),
      },
    });
    await prisma.dealActivity.createMany({
      data: deal.activities.map((activity, i) => ({
        id: `${deal.id}-act-${i + 1}`,
        dealId: deal.id,
        authorId: activity.authorId,
        kind: activity.kind,
        body: activity.body,
        createdAt: d(activity.at),
      })),
    });
  }

  await prisma.bookingCard.createMany({
    data: BOOKING_CARDS.map((card) => ({
      id: card.id,
      externalRef: card.externalRef,
      name: card.name,
      email: card.email,
      company: card.company,
      companySize: card.companySize,
      automationGoal: card.automationGoal,
      slotStart: d(card.slotStart),
      slotEnd: d(card.slotEnd),
      status: card.status,
      claimedById: card.claimedById ?? null,
      claimedAt: card.claimedAt ? d(card.claimedAt) : null,
      dealId: card.dealId ?? null,
      submittedAt: d(card.submittedAt),
      createdAt: d(card.submittedAt),
    })),
  });

  // Jobs, workers, bids. Job creation predates its earliest bid.
  for (const job of JOBS) {
    const jobBids = BIDS.filter((b) => b.jobId === job.id);
    const earliestBid = jobBids.map((b) => b.createdAt).sort()[0];
    // A converted job cannot predate the deal it converted from (PRD 7.11).
    const linkedDeal = job.dealId ? DEALS.find((deal) => deal.id === job.dealId) : undefined;
    let createdAt = earliestBid ? addDays(earliestBid, -5) : d("2026-05-01T09:00:00");
    if (linkedDeal?.wonAt) {
      const wonMoment = d(`${linkedDeal.wonAt}T11:00:00`);
      if (createdAt < wonMoment) createdAt = wonMoment;
    }
    await prisma.job.create({
      data: {
        id: job.id,
        title: job.title,
        brief: job.brief,
        description: jobDescription(job),
        status: job.status,
        grossValue: new Prisma.Decimal(job.grossValue),
        workerPool: new Prisma.Decimal(job.workerPool),
        firmMargin: new Prisma.Decimal(job.firmMargin),
        accountId: job.accountId,
        dealId: job.dealId ?? null,
        departmentId: job.departmentId,
        createdAt,
        dueAt: job.dueAt ? d(`${job.dueAt}T17:00:00`) : null,
        completedAt: job.completedAt ? d(`${job.completedAt}T17:00:00`) : null,
      },
    });
  }
  await prisma.jobMember.createMany({
    data: JOBS.flatMap((job) => job.workerIds.map((memberId) => ({ jobId: job.id, memberId }))),
  });
  await prisma.bid.createMany({
    data: BIDS.map((bid) => ({
      id: bid.id,
      jobId: bid.jobId,
      memberId: bid.memberId,
      proposedSplit: new Prisma.Decimal(bid.proposedSplit),
      pitchText: bid.pitchText,
      status: bid.status,
      createdAt: d(bid.createdAt),
    })),
  });

  // Channels and messages (the deterministic Shadow draft included).
  // A channel exists just before its first message; department and firm
  // channels date from the firm's pre-window history.
  const messages = buildMessages();
  const channelCreatedAt = (channelId: string, kind: string): Date => {
    if (kind === "DEPARTMENT" || kind === "FIRM") return d("2025-06-02T09:00:00");
    const first = messages
      .filter((m) => m.channelId === channelId)
      .map((m) => m.at)
      .sort()[0];
    return first ? addDays(first, -1) : d("2026-05-01T09:00:00");
  };
  await prisma.channel.createMany({
    data: CHANNELS.map((channel) => ({
      id: channel.id,
      kind: channel.kind,
      name: channel.name,
      departmentId: channel.departmentId ?? null,
      jobId: channel.jobId ?? null,
      accountId: channel.accountId ?? null,
      createdAt: channelCreatedAt(channel.id, channel.kind),
    })),
  });
  await prisma.message.createMany({
    data: messages.map((m) => ({
      id: m.id,
      channelId: m.channelId,
      senderId: m.senderId,
      body: m.body,
      isShadowDraft: m.isShadowDraft ?? false,
      bookingCardId: m.bookingCardId ?? null,
      createdAt: d(m.at),
    })),
  });

  // Forum.
  for (const post of allForumPosts()) {
    await prisma.forumPost.create({
      data: {
        id: post.id,
        authorId: post.authorId,
        departmentId: post.departmentId ?? null,
        title: post.title ?? null,
        body: post.body,
        createdAt: d(post.at),
      },
    });
    await prisma.forumPost.createMany({
      data: post.replies.map((reply) => ({
        id: reply.id,
        authorId: reply.authorId,
        body: reply.body,
        parentId: post.id,
        createdAt: d(reply.at),
      })),
    });
  }

  await prisma.vaultAsset.createMany({
    data: allVaultAssets().map((asset) => ({
      id: asset.id,
      title: asset.title,
      fileUrl: asset.fileUrl,
      fileType: asset.fileType,
      sizeKb: asset.sizeKb ?? null,
      isSharedSocial: asset.isSharedSocial,
      uploadedById: asset.uploadedById,
      jobId: asset.jobId ?? null,
      createdAt: d(`${asset.createdAt}T12:00:00`),
    })),
  });

  // Portal content. Sara Lindqvist (moderator) is the last guide editor.
  await prisma.portalGuide.create({
    data: { id: "main", markdown: PORTAL_GUIDE_MD, updatedById: "u-sara" },
  });
  await prisma.infoBarMessage.createMany({
    data: INFO_BAR.map((row) => ({
      id: row.id,
      text: row.text,
      href: row.href ?? null,
      isActive: row.isActive,
      order: row.order,
    })),
  });

  // The ledger, then the aggregates it implies (PRD section 10: backfilled
  // XP so figures come out non-uniform and auditable).
  const ledger = buildLedger();
  await prisma.xpEvent.createMany({
    data: ledger.map((event, i) => ({
      id: `xp-${String(i + 1).padStart(4, "0")}`,
      userId: event.userId,
      amount: event.amount,
      reason: event.reason,
      refId: event.refId,
      createdAt: event.createdAt,
    })),
  });

  for (const user of USERS) {
    const xp = ledger
      .filter((event) => event.userId === user.id)
      .reduce((sum, event) => sum + event.amount, 0);
    const completedSplits = BIDS.filter(
      (bid) =>
        bid.memberId === user.id &&
        bid.status === "ACCEPTED" &&
        JOBS.some((job) => job.id === bid.jobId && job.status === "COMPLETED"),
    ).reduce((sum, bid) => sum + bid.proposedSplit, 0);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        experiencePoints: xp,
        currentTierLevel: tierForXp(xp).level,
        totalEarnings: new Prisma.Decimal(user.history.earnings + completedSplits),
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    deals: await prisma.deal.count(),
    bookingCards: await prisma.bookingCard.count(),
    jobs: await prisma.job.count(),
    bids: await prisma.bid.count(),
    courses: await prisma.course.count(),
    lessons: await prisma.lesson.count(),
    channels: await prisma.channel.count(),
    messages: await prisma.message.count(),
    forumPosts: await prisma.forumPost.count(),
    vaultAssets: await prisma.vaultAsset.count(),
    xpEvents: await prisma.xpEvent.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
