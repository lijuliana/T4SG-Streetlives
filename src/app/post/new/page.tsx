import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NewPostForm from "@/components/NewPostForm";

export default async function NewPostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-brand-yellow flex flex-col">
      {/* Header */}
      <div className="px-5 pt-10 pb-8 flex items-start gap-4">
        <Link
          href="/feed"
          className="mt-1 p-1 rounded-lg hover:bg-black/10 transition"
          aria-label="Back to feed"
        >
          <ArrowLeft size={20} className="text-gray-900" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">New Post</h1>
          <p className="text-sm text-gray-700 mt-0.5">
            Share with the community
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-8 pb-10 shadow-inner">
        <NewPostForm userId={user.id} />
      </div>
    </div>
  );
}
