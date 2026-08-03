"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { Image, Video, Lock, Eye } from "lucide-react";
import type { Profile } from "@/types";

interface Album {
  id: string; title: string; description?: string; type: "photo" | "video";
  cover_url?: string; price?: number; is_published: boolean; created_at: string;
}

export default function Home() {
  const [user, setUser] = useState<{ id: string; username?: string; isAdmin?: boolean } | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: pd } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({ id: session.user.id, username: (pd as Profile)?.username || session.user.email, isAdmin: (pd as Profile)?.is_admin || false });
      }
      try {
        const r = await fetch("/api/admin/albums");
        if (r.ok) {
          const d = await r.json();
          setAlbums((d.albums || []).filter((a: Album) => a.is_published));
        }
      } catch { }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 py-20 px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Exclusive Content</span></h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">Premium photos and videos. Unlock full albums with one purchase.</p>
          <div className="flex gap-3 justify-center">
            {user
              ? <><Link href="/profile" className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg transition-all">My Profile</Link><Link href="#albums" className="px-8 py-3 rounded-full font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Browse</Link></>
              : <><Link href="/register" className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg transition-all">Join Now</Link><Link href="#albums" className="px-8 py-3 rounded-full font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">Browse Free Previews</Link></>
            }
          </div>
        </section>

        {/* Album Grid */}
        <section id="albums" className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Latest Albums</h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : albums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map(a => (
                <Link key={a.id} href={`/album/${a.id}`} className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                    {a.cover_url ? (
                      <img src={a.cover_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-300">{a.type === "video" ? <Video className="w-12 h-12" /> : <Image className="w-12 h-12" />}</div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur">{a.type}</span>
                    </div>
                    <div className="absolute top-2 right-2">
                      {a.price ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/80 text-white backdrop-blur flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />${a.price}</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/80 text-white backdrop-blur flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />Free</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{a.title}</h3>
                    {a.description && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{a.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-400"><p className="text-lg mb-2">No content published yet</p><p className="text-sm">Check back soon!</p></div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 px-4 text-center text-sm text-zinc-400">
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
          <div className="flex gap-4 justify-center mt-2">
            <Link href="/login" className="hover:text-zinc-600 dark:hover:text-zinc-300">Sign In</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
