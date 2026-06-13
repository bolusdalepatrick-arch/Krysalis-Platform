import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import StatusBadge from "@/components/StatusBadge";
import ReplyComposer from "@/components/forum/ReplyComposer";
import { formatDate } from "@/lib/format";
import type { ForumPostView } from "@/lib/queries/forum";

/** One forum post (PRD 7.4): author row, optional title, plain-text body with
 *  line breaks, replies one level deep under a hairline, and a reply composer. */
export default function ForumPostCard({ post }: { post: ForumPostView }) {
  return (
    <article className="max-w-2xl rounded-m border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <AvatarBadge id={post.authorId} name={post.authorName} />
        <Link
          href={`/dashboard/people/${post.authorId}`}
          className="text-md font-medium text-primary hover:text-accent"
        >
          {post.authorName}
        </Link>
        {post.departmentName ? <StatusBadge tone="neutral">{post.departmentName}</StatusBadge> : null}
        <span className="figure ml-auto text-2xs text-muted">{formatDate(post.createdAt)}</span>
      </div>

      {post.title ? (
        <h2 className="mt-3 text-md font-bold tracking-[-0.01em] text-primary">{post.title}</h2>
      ) : null}
      <p className="mt-1.5 whitespace-pre-line text-md text-secondary">{post.body}</p>

      {post.replies.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3 border-l border-line pl-4">
          {post.replies.map((reply) => (
            <div key={reply.id}>
              <div className="flex items-center gap-2">
                <AvatarBadge id={reply.authorId} name={reply.authorName} size={20} />
                <Link
                  href={`/dashboard/people/${reply.authorId}`}
                  className="text-sm font-medium text-primary hover:text-accent"
                >
                  {reply.authorName}
                </Link>
                <span className="figure ml-auto text-2xs text-muted">{formatDate(reply.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-secondary">{reply.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      <ReplyComposer parentId={post.id} />
    </article>
  );
}
