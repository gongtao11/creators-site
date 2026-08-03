"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Loader2, Trash2, Image, Video, Upload, X, Play } from "lucide-react";
import type { Profile } from "@/types";

interface Album { id: string; title: string; description?: string; type: string; cover_url?: string; price?: number; is_published: boolean; }
interface AlbumImage { id: string; url: string; sort_order: number; }

export default function AdminAlbumDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload more to this album
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data: pd } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!(pd as Profile)?.is_admin) { window.location.href = "/"; return; }
    setProfile(pd as Profile);

    try {
      const r = await fetch("/api/admin/albums");
      if (r.ok) {
        const d = await r.json();
        const found = (d.albums || []).find((a: Album) => a.id === id);
        if (found) setAlbum(found);
      }
    } catch {}

    try {
      const r = await fetch(`/api/admin/album-images?album_id=${id}`);
      if (r.ok) {
        const d = await r.json();
        setImages(d.images || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [id]);

  const deleteImage = async (imageId: string) => {
    setDeleting(imageId);
    await fetch(`/api/admin/album-images?id=${imageId}`, { method: "DELETE" });
    setImages(prev => prev.filter(img => img.id !== imageId));
    setDeleting(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files || []);
    if (fs.length) setFiles(fs);
  };

  const uploadMore = async () => {
    if (files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(Math.round((i / files.length) * 90));
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("content").upload(fileName, file, {
          contentType: file.type || "image/jpeg", cacheControl: "3600", upsert: false,
        });
        if (upErr) throw new Error(upErr.message);
        const { data: urlData } = supabase.storage.from("content").getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
      } catch { continue; }
    }

    if (urls.length > 0) {
      await fetch("/api/admin/add-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: id, urls, startIndex: images.length }),
      });
    }

    setProgress(100);
    setUploading(false);
    setFiles([]);
    loadAll();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  if (!album) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p>Album not found</p><Link href="/admin/content" className="text-pink-500">Back to Albums</Link></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin } : null} />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <Link href="/admin/content" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="w-3 h-3" /> Back to Albums
        </Link>

        {/* Album info */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{album.title}</h1>
            <span className="text-sm text-zinc-400">{images.length} items &middot; {album.type} &middot; {album.price ? `$${album.price}` : "Free"}</span>
          </div>
          {album.description && <p className="text-zinc-500 text-sm mb-4">{album.description}</p>}

          {/* Quick upload */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              <span className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-pink-50 dark:bg-pink-950 text-pink-600 hover:bg-pink-100 font-medium transition-colors">
                <Upload className="w-3.5 h-3.5" /> Select Files
              </span>
            </label>
            {files.length > 0 && (
              <>
                <span className="text-sm text-zinc-500">{files.length} selected</span>
                <button onClick={uploadMore} disabled={uploading}
                  className="text-sm px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium disabled:opacity-50">
                  {uploading ? `Uploading ${progress}%` : "Upload"}
                </button>
                <button onClick={() => setFiles([])} className="p-1 text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>
              </>
            )}
          </div>
        </div>

        {/* Image Grid */}
        {images.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border">
            <Image className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
            <h2 className="text-lg font-semibold mb-2">No images yet</h2>
            <p className="text-zinc-400 text-sm">Upload photos or videos to this album</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {images.map((img, idx) => (
              <div key={img.id} className="group relative bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden aspect-square">
                {album.type === "video" ? (
                  <div className="w-full h-full relative bg-black cursor-pointer">
                    <video src={img.url} className="w-full h-full object-cover opacity-50" preload="metadata" playsInline muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-10 h-10 text-pink-400" />
                    </div>
                    <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">#{idx + 1}</span>
                  </div>
                ) : (
                  <img src={img.url} alt={`#${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                )}
                {/* Index badge */}
                <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">#{idx + 1}</span>
                {/* Delete button */}
                <button
                  onClick={() => deleteImage(img.id)}
                  disabled={deleting === img.id}
                  className="absolute top-1 right-1 p-1 rounded-lg bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                  title="Delete"
                >
                  {deleting === img.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
