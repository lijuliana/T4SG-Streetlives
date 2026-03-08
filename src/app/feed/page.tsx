import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import SignOutButton from "@/components/SignOutButton";

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  // Fetch posts with author emails via a join
  const { data: posts } = await supabase
    .from("posts")
    .select("id, content, created_at, user_id")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <h2 className="font-black text-lg text-gray-900">Community Feed</h2>
        <SignOutButton />
      </div>

      {/* Posts */}
      <main className="flex-1 px-4 py-5 space-y-3 max-w-lg mx-auto w-full">
        {!posts || posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-semibold text-gray-700">No posts yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to share something.</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={{ ...post, author_email: undefined }}
              index={i}
            />
          ))
        )}
      </main>

      {/* FAB */}
      <Link
        href="/post/new"
        className="fixed bottom-6 right-5 w-14 h-14 bg-brand-yellow rounded-full shadow-lg flex items-center justify-center hover:brightness-95 transition"
        aria-label="Create new post"
      >
        <Plus size={26} strokeWidth={2.5} className="text-gray-900" />
      </Link>
    </div>
  );
}
