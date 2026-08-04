"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { Image, Video, Lock, Eye, ChevronDown } from "lucide-react";
import type { Profile } from "@/types";

interface Album {
  id: string; title: string; description?: string; type: "photo" | "video";
  cover_url?: string; price?: number; is_published: boolean; created_at: string;
}

export default function Home() {
  const [user, setUser] = useState<{ id: string; username?: string; isAdmin?: boolean } | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [bgImages, setBgImages] = useState<string[]>([]);
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
          const published = (d.albums || []).filter((a: Album) => a.is_published);
          setAlbums(published);

          // Load up to 24 images from photo albums for background
          const allImages: string[] = [];
          for (const a of published) {
            if (a.type === "photo" && allImages.length < 30) {
              try {
                const imgRes = await fetch(`/api/admin/album-images?album_id=${a.id}`);
                if (imgRes.ok) {
                  const imgData = await imgRes.json();
                  for (const img of (imgData.images || [])) {
                    if (!/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(img.url)) {
                      allImages.push(img.url);
                      if (allImages.length >= 30) break;
                    }
                  }
                }
              } catch {}
            }
          }
          // Add album covers as fallback
          for (const a of published) {
            if (allImages.length >= 30) break;
            if (a.cover_url && !/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(a.cover_url)) {
              allImages.push(a.cover_url);
            }
          }
          setBgImages(allImages);
        }
      } catch { }
      setLoading(false);
    })();
  }, []);

  // Build an irregular mosaic layout
  const mosaicItems = bgImages.slice(0, 24).map((url, i) => {
    // Vary sizes for irregular look
    const sizes = [
      "col-span-2 row-span-2",
      "col-span-1 row-span-1",
      "col-span-2 row-span-1",
      "col-span-1 row-span-2",
      "col-span-1 row-span-1",
      "col-span-2 row-span-2",
      "col-span-1 row-span-1",
      "col-span-2 row-span-1",
    ];
    const rotates = [
      "rotate-0", "rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "rotate-0",
      "-rotate-1", "rotate-1",
    ];
    return { url, size: sizes[i % sizes.length], rotate: rotates[i % rotates.length], i };
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0008]">
      <Navbar user={user} />

      {/* Hero with photo mosaic background */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0016]/95 via-[#0d0012]/85 to-[#0a0008]/95 z-10" />

        {/* Photo mosaic grid */}
        <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1 p-1 opacity-30 z-0">
          {mosaicItems.map((item) => (
            <div
              key={item.i}
              className={`${item.size} ${item.rotate} overflow-hidden rounded-sm transition-all duration-1000`}
              style={{ animationDelay: `${item.i * 150}ms` }}
            >
              <img
                src={item.url}
                alt=""
                className="w-full h-full object-cover animate-pulse"
                style={{ animationDuration: `${3 + (item.i % 4)}s` }}
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] z-5" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] z-5" />

        {/* Text content */}
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          {/* Small badge */}
          <div className="inline-block mb-6 px-5 py-2 rounded-full bg-white/5 backdrop-blur border border-white/10 text-pink-300 text-xs tracking-[0.2em] uppercase">
            Exclusive Access &bull; 18+
          </div>

          {/* Provocative tagline */}
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light italic text-white/90 mb-8 leading-relaxed tracking-wide px-4"
             style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            &ldquo;Hey baby, welcome to my private world.<br />
            If you want to enter my body,<br />
            please feel free to do so.<br />
            <span className="text-pink-400 font-bold not-italic">Slam into me hard!</span>&rdquo;
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            {user ? (
              <>
                <Link href="/profile" className="px-10 py-4 rounded-full font-bold text-base text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-2xl shadow-pink-600/30 hover:shadow-pink-500/50 transition-all tracking-wide">
                  My Profile
                </Link>
                <Link href="#albums" className="px-10 py-4 rounded-full font-bold text-base text-pink-300 border-2 border-pink-500/30 hover:border-pink-400 hover:text-white hover:bg-pink-500/10 transition-all tracking-wide">
                  Browse Content
                  <ChevronDown className="inline w-4 h-4 ml-2 animate-bounce" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="px-10 py-4 rounded-full font-bold text-base text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-2xl shadow-pink-600/30 hover:shadow-pink-500/50 transition-all tracking-wide animate-pulse">
                  Join Now
                </Link>
                <Link href="#albums" className="px-10 py-4 rounded-full font-bold text-base text-pink-300 border-2 border-pink-500/30 hover:border-pink-400 hover:text-white hover:bg-pink-500/10 transition-all tracking-wide">
                  Free Preview
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 justify-center mt-14 text-center">
            <div>
              <p className="text-2xl font-bold text-pink-400">{albums.length}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Albums</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-400">{bgImages.length}+</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Photos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-400">24/7</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Access</p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 z-20 text-zinc-500 text-xs animate-bounce">
          <ChevronDown className="w-5 h-5 mx-auto" />
          <span className="block mt-1">Scroll</span>
        </div>
      </section>

      {/* Album Grid */}
      <section id="albums" className="max-w-6xl mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs text-pink-400 uppercase tracking-[0.2em] font-medium">My Collections</span>
          <h2 className="text-3xl font-bold mt-3 mb-3 text-white">Latest Albums</h2>
          <p className="text-zinc-500 max-w-md mx-auto">Unlock exclusive photo sets and videos. One payment, full access.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="aspect-[3/4] bg-zinc-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : albums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map(a => (
              <Link key={a.id} href={`/album/${a.id}`} className="group bg-zinc-900/80 backdrop-blur rounded-2xl border border-zinc-700/50 overflow-hidden hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/10 transition-all">
                <div className="aspect-[3/4] bg-zinc-800 relative overflow-hidden">
                  {a.cover_url ? (
                    /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(a.cover_url) ? (
                      <video src={a.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" preload="metadata" muted playsInline />
                    ) : (
                      <img src={a.cover_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-600">
                      {a.type === "video" ? <Video className="w-12 h-12" /> : <Image className="w-12 h-12" />}
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur">{a.type}</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    {a.price ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-600/90 text-white backdrop-blur flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />${a.price}</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-600/90 text-white backdrop-blur flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />Free</span>
                    )}
                  </div>
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-zinc-200 truncate">{a.title}</h3>
                  {a.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{a.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg mb-2">No content published yet</p>
            <p className="text-sm">Check back soon!</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4 text-center text-sm text-zinc-600 relative z-10">
        <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        <div className="flex gap-4 justify-center mt-2">
          <Link href="/login" className="hover:text-pink-400 transition-colors">Sign In</Link>
        </div>
      </footer>
    </div>
  );
}
