import PageHeader from "@/components/PageHeader";
import ForumPostCard from "@/components/forum/ForumPostCard";
import NewPostPanel from "@/components/forum/NewPostPanel";
import { departmentOptions, forumFeed } from "@/lib/queries/forum";

/** Forum (PRD 7.4): one firm-wide reverse-chrono feed, optional department
 *  tag, replies one level deep, live posting with capped XP. */
export default async function ForumPage() {
  const [posts, departments] = await Promise.all([forumFeed(), departmentOptions()]);

  return (
    <div>
      <PageHeader
        eyebrow="Forum"
        title="Field notes"
        meta="One firm-wide feed; tag a department when it helps."
      />
      <NewPostPanel departments={departments} />
      <div className="flex flex-col gap-4 px-6 py-6">
        {posts.length === 0 ? (
          <p className="max-w-2xl text-sm text-secondary">
            No posts yet. Start a thread — a process question, a win worth sharing,
            a tooling note.
          </p>
        ) : (
          posts.map((post) => <ForumPostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
