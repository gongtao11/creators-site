"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { User, Mail, Crown, Calendar, Loader2, MessageCircle, ShoppingBag, LogOut } from "lucide-react";
import type { Profile, Purchase } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email || "");

      // 鍔犺浇 profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData as Profile | null);

      // 鍔犺浇璐拱璁板綍
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPurchases((purchasesData as Purchase[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={
          profile
            ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin }
            : null
        }
      />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        {/* 涓汉淇℃伅鍗＄墖 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-3xl font-bold">
              {profile?.username?.[0]?.toUpperCase() || userEmail[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile?.username || "User"}</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                <Mail className="w-3.5 h-3.5" /> {userEmail}
              </p>
              {profile?.is_admin && (
                <span className="inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600">
                  ADMIN
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link
              href="/messages/new"
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-pink-50 dark:bg-pink-950 text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900 transition-colors font-medium"
            >
              <MessageCircle className="w-4 h-4" /> Messages
            </Link>
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors font-medium"
              >
                <Crown className="w-4 h-4" /> Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* 璐拱璁板綍 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <ShoppingBag className="w-4 h-4 text-pink-500" />
            My Purchases
          </h2>

          {purchases.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No purchases yet.</p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm text-pink-500 hover:text-pink-600 font-medium"
              >
                Browse content 鈫?              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {purchases.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {p.plan || "Single Purchase"}
                    </p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.created_at).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === "active"
                        ? "bg-green-100 dark:bg-green-950 text-green-600"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 閫€鍑虹櫥褰?*/}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
