"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { Paywall, SubscriptionCTA } from "@/components/content/Paywall";
import { ArrowLeft, Lock, Loader2, Eye } from "lucide-react";
import Link from "next/link";
import type { Content, Purchase, Profile } from "@/types";

export default function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      
      const { data: contentData } = await supabase
        .from("contents")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      setContent(contentData as Content | null);

      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData as Profile | null);

        
        if (contentData) {
          const { data: purchases } = await supabase
            .from("purchases")
            .select("*")
            .eq("user_id", user.id)
            .or(
              `content_id.eq.${(contentData as Content).id},plan.neq.single`
            );

          const hasActive =
            purchases?.some(
              (p: Purchase) =>
                p.status === "active" &&
                (!p.expires_at || new Date(p.expires_at) > new Date())
            ) || false;

          setHasAccess(hasActive || !(contentData as Content).price);
        }
      }

      setLoading(false);
    }
    load();
  }, [router, resolvedParams.id]);

  if (loading) {
    return (
      <>
        <Navbar user={null} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </main>
      </>
    );
  }

  if (!content) {
    return (
      <>
        <Navbar user={null} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">Content not found</p>
            <Link href="/" className="text-pink-500 hover:text-pink-600 text-sm">
              ← Back to home
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar
        user={
          profile
            ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin }
            : null
        }
      />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Content Header */}
        <div className="mb-8">
          <span className="inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 capitalize">
            {content.type}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{content.title}</h1>
          {content.description && (
            <p className="text-zinc-500 dark:text-zinc-400">
              {content.description}
            </p>
          )}
        </div>

        {/* Preview Image */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-8">
          {content.preview_url ? (
            <img
              src={content.preview_url}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Eye className="w-16 h-16 text-zinc-300 dark:text-zinc-600" />
            </div>
          )}

          {!hasAccess && content.price && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center text-white">
                <Lock className="w-12 h-12 mx-auto mb-3" />
                <p className="text-xl font-bold mb-1">Locked Content</p>
                <p className="text-sm opacity-80">
                  Purchase to unlock this {content.type}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content or Paywall */}
        {hasAccess ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-green-500 font-semibold mb-4">✓ Unlocked</p>
            {content.type === "photo" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                  Photo 1
                </div>
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                  Photo 2
                </div>
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                  Photo 3
                </div>
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                  Photo 4
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                Video Player
              </div>
            )}
          </div>
        ) : (
          content.price && (
            <>
              <Paywall
                contentTitle={content.title}
                price={content.price}
                contentType={content.type}
                onPurchase={async () => {
                  
                  alert("Payment integration coming soon! Redirect to Lemon Squeezy checkout.");
                }}
              />
              <div className="mt-8">
                <SubscriptionCTA />
              </div>
            </>
          )
        )}
      </main>
    </>
  );
}
