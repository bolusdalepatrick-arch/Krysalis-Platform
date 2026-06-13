import { prisma } from "@/lib/db";

/** Forum reads (PRD 7.4): one firm-wide reverse-chrono feed, replies one
 *  level deep. Serialized for the feed and its card. */

export interface ForumReplyView {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ForumPostView {
  id: string;
  authorId: string;
  authorName: string;
  departmentId: string | null;
  departmentName: string | null;
  title: string | null;
  body: string;
  createdAt: string;
  replies: ForumReplyView[];
}

export async function forumFeed(): Promise<ForumPostView[]> {
  const posts = await prisma.forumPost.findMany({
    where: { parentId: null },
    include: {
      author: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      replies: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return posts.map((p) => ({
    id: p.id,
    authorId: p.author.id,
    authorName: p.author.name,
    departmentId: p.department?.id ?? null,
    departmentName: p.department?.name ?? null,
    title: p.title,
    body: p.body,
    createdAt: p.createdAt.toISOString(),
    replies: p.replies.map((r) => ({
      id: r.id,
      authorId: r.author.id,
      authorName: r.author.name,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    })),
  }));
}

/** Departments for the post composer's optional tag and the vault filter. */
export async function departmentOptions(): Promise<{ id: string; name: string }[]> {
  return prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
