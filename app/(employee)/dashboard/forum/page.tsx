import PageHeader from "@/components/PageHeader";
import ForumPostCard from "@/components/forum/ForumPostCard";
import { FORUM_POSTS } from "@/lib/mock";

/** Forum (PRD 7.4): one firm-wide reverse-chrono feed, optional department
 *  tag, replies one level deep. Posting lands with the database (M2). */
export default function ForumPage() {
  const posts = [...FORUM_POSTS].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div>
      <PageHeader
        eyebrow="Forum"
        title="Field notes"
        meta="One firm-wide feed; tag a department when it helps."
        actions={
          <button
            type="button"
            disabled
            className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-60"
          >
            New post
          </button>
        }
      />
      <div className="flex flex-col gap-4 px-6 py-6">
        {posts.map((post) => (
          <ForumPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
