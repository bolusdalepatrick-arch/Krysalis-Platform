import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { DEPARTMENTS, personById } from "@/lib/mock";
import type { MockForumPost } from "@/lib/mock";

/** One forum post (PRD 7.4): author row, optional title, plain-text body with
 *  line breaks, replies one level deep under a hairline. */
export default function ForumPostCard({ post }: { post: MockForumPost }) {
  const author = personById(post.authorId);
  const department = post.departmentId
    ? DEPARTMENTS.find((d) => d.id === post.departmentId)
    : undefined;

  return (
    <article className="max-w-2xl rounded-m border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <AvatarBadge id={post.authorId} name={author?.name ?? "Unknown"} />
        <Link
          href={`/dashboard/people/${post.authorId}`}
          className="text-md font-medium text-primary hover:text-accent"
        >
          {author?.name ?? "Unknown"}
        </Link>
        {department ? <StatusBadge tone="neutral">{department.name}</StatusBadge> : null}
        <span className="figure ml-auto text-2xs text-muted">{formatDate(post.at)}</span>
      </div>

      {post.title ? (
        <h2 className="mt-3 text-md font-bold tracking-[-0.01em] text-primary">{post.title}</h2>
      ) : null}
      <p className="mt-1.5 whitespace-pre-line text-md text-secondary">{post.body}</p>

      {post.replies.length === 0 ? (
        <p className="figure mt-4 text-xs text-muted">No replies yet</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 border-l border-line pl-4">
          {post.replies.map((reply) => {
            const replyAuthor = personById(reply.authorId);
            return (
              <div key={reply.id}>
                <div className="flex items-center gap-2">
                  <AvatarBadge id={reply.authorId} name={replyAuthor?.name ?? "Unknown"} size={20} />
                  <Link
                    href={`/dashboard/people/${reply.authorId}`}
                    className="text-sm font-medium text-primary hover:text-accent"
                  >
                    {replyAuthor?.name ?? "Unknown"}
                  </Link>
                  <span className="figure ml-auto text-2xs text-muted">{formatDate(reply.at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-secondary">{reply.body}</p>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
