"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import {
  MessageCircle,
  Image,
  FileText,
  Users,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { Profile } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!(profileData as Profile)?.is_admin) {
        router.push("/");
        return;
      }

      setProfile(profileData as Profile);
      setLoading(false);
    }
    load();
  }, [router]);

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

  const cards = [
    {
      title: "Script Manager",
      description: "Edit AI auto-reply scripts (CSV)",
      href: "/admin/script",
      icon: FileText,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Content Manager",
      description: "Upload photos & videos, set prices",
      href: "/admin/content",
      icon: Image,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Messages",
      description: "View and manage fan messages",
      href: "/messages",
      icon: MessageCircle,
      color: "text-green-500 bg-green-50 dark:bg-green-950",
    },
    {
      title: "Profile & Purchases",
      description: "View your profile and purchase history",
      href: "/profile",
      icon: Users,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950",
    },
  ];

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
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Manage your content and AI scripts
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-pink-500 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {card.description}
                </p>
                <div className="flex justify-end mt-4">
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
