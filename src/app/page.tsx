"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ContentCard } from "@/components/content/ContentCard";
import type { Profile, Content } from "@/types";

export default function Home() {
  const [user, setUser] = useState<{
    id: string;
    username?: string;
    isAdmin?: boolean;
  } | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);

  
  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          username: (profileData as Profile)?.username || session.user.email,
          isAdmin: (profileData as Profile)?.is_admin || false,
        });
      }

      setLoadingUser(false);
    }
    load();
  }, []);

  
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/content");
        if (res.ok) {
          const data = await res.json();
          const published = (data.contents || []).filter(
            (c: Content) => c.is_published
          );
          setContents(published);
        }
      } catch (e) {
        console.error("Load content failed:", e);
      }
      setLoadingContent(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                Exclusive Content
              </span>
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
              Premium photos and videos you won&apos;t find anywhere else.
              Subscribe to unlock everything.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/25 transition-all"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="#content"
                    className="px-8 py-3 rounded-full font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  >
                    Browse Content
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/25 transition-all"
                  >
                    Join Now
                  </Link>
                  <Link
                    href="#content"
                    className="px-8 py-3 rounded-full font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  >
                    Browse Free Previews
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <section id="content" className="max-w-5xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Latest Content</h2>
            {!user && (
              <Link
                href="/login"
                className="text-sm text-pink-500 hover:text-pink-600 font-medium"
              >
                Sign in to see more →
              </Link>
            )}
          </div>

          {loadingContent ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : contents.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {contents.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-400">
              <p className="text-lg mb-2">No content published yet</p>
              <p className="text-sm">Check back soon!</p>
            </div>
          )}
        </section>

        {/* Pricing Section */}
        <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">
              Choose Your Plan
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                {
                  name: "Basic",
                  price: "$5",
                  period: "/month",
                  features: [
                    "All photo sets",
                    "HD quality",
                    "Monthly exclusive",
                  ],
                  highlighted: false,
                },
                {
                  name: "VIP",
                  price: "$15",
                  period: "/month",
                  features: [
                    "Everything in Basic",
                    "All videos included",
                    "Behind-the-scenes",
                    "Early access",
                  ],
                  highlighted: true,
                },
                {
                  name: "Diamond",
                  price: "$30",
                  period: "/month",
                  features: [
                    "Everything in VIP",
                    "Custom content requests",
                    "Priority DMs",
                    "Monthly personal video",
                  ],
                  highlighted: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-6 border-2 ${
                    plan.highlighted
                      ? "border-pink-500 bg-white dark:bg-zinc-900 shadow-lg scale-105"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="inline-block text-xs font-bold text-pink-500 bg-pink-50 dark:bg-pink-950 px-2 py-1 rounded-full mb-3">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-zinc-400">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2"
                      >
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block text-center py-2.5 rounded-full text-sm font-semibold transition-all ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg"
                        : "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 px-4 text-center text-sm text-zinc-400">
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
          <div className="flex gap-4 justify-center mt-2">
            <Link href="/terms" className="hover:text-zinc-600 dark:hover:text-zinc-300">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300">
              Privacy
            </Link>
            {user ? (
              <Link
                href="/profile"
                className="hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Profile
              </Link>
            ) : (
              <Link
                href="/login"
                className="hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Sign In
              </Link>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}
