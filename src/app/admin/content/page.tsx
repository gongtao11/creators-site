"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Loader2, Image, Video, Edit, Trash2, Upload, X, Eye, EyeOff, CheckCircle, Plus, FolderOpen } from "lucide-react";
import type { Profile } from "@/types";

interface Album { id: string; title: string; description?: string; type: "photo" | "video"; cover_url?: string; price?: number; is_published: boolean; created_at: string; }

export default function AdminContentPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create/edit album modal
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<"photo" | "video">("photo");
  const [formPrice, setFormPrice] = useState("");
  const [formPublished, setFormPublished] = useState(true);
  const [formSaving, setFormSaving] = useState(false);

  // Upload to album modal
  const [uploadAlbumId, setUploadAlbumId] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadUploading, setUploadUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ uploaded: number; failed: number } | null>(null);

  const loadAlbums = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data: pd } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!(pd as Profile)?.is_admin) { window.location.href = "/"; return; }
    setProfile(pd as Profile);
    try { const r = await fetch("/api/admin/albums"); if (r.ok) setAlbums((await r.json()).albums || []); } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { loadAlbums(); }, [loadAlbums]);

  // Create / Edit album
  const openCreate = () => { setEditId(null); setFormTitle(""); setFormDesc(""); setFormType("photo"); setFormPrice(""); setFormPublished(true); setShowForm(true); };
  const openEdit = (a: Album) => { setEditId(a.id); setFormTitle(a.title); setFormDesc(a.description || ""); setFormType(a.type); setFormPrice(a.price ? String(a.price) : ""); setFormPublished(a.is_published); setShowForm(true); };

  const saveAlbum = async () => {
    if (!formTitle.trim()) return;
    setFormSaving(true);
    const body = { id: editId, title: formTitle, description: formDesc, type: formType, price: formPrice ? parseFloat(formPrice) : null, is_published: formPublished };
    const url = editId ? "/api/admin/albums" : "/api/admin/albums";
    await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setFormSaving(false); setShowForm(false); await loadAlbums();
  };

  const deleteAlbum = async (id: string) => { if (!confirm("Delete album and all its images?")) return; await fetch(`/api/admin/albums?id=${id}`, { method: "DELETE" }); await loadAlbums(); };

  // Upload images
  const openUpload = (albumId: string) => { setUploadAlbumId(albumId); setUploadFiles([]); setUploadResult(null); setUploadProgress(0); };
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => { const fs = Array.from(e.target.files || []); if (fs.length) setUploadFiles(fs); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const startUpload = async () => {
    if (!uploadAlbumId || uploadFiles.length === 0) return;
    setUploadUploading(true); setUploadProgress(0);
    const formData = new FormData();
    uploadFiles.forEach(f => formData.append("files", f));
    formData.append("album_id", uploadAlbumId);
    const int = setInterval(() => setUploadProgress(p => Math.min(p + 7, 90)), 300);
    try {
      const r = await fetch("/api/admin/album-images", { method: "POST", body: formData });
      const d = await r.json();
      clearInterval(int); setUploadProgress(100);
      setUploadResult({ uploaded: d.uploaded, failed: d.failed });
      await loadAlbums();
    } catch { clearInterval(int); setUploadResult({ uploaded: 0, failed: uploadFiles.length }); }
    setUploadUploading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin } : null} />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-2"><ArrowLeft className="w-3 h-3" /> Admin</Link>
            <h1 className="text-2xl font-bold">Albums</h1>
            <p className="text-sm text-zinc-400">{albums.length} albums</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> New Album
          </button>
        </div>

        {/* Album Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{editId ? "Edit" : "Create"} Album</h2><button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="text-xs font-medium text-zinc-500">Album Name</label><input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border mt-0.5 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50" placeholder="Summer Vibes" /></div>
                <div><label className="text-xs font-medium text-zinc-500">Description</label><textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border mt-0.5 bg-white dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50" placeholder="Exclusive beach photoshoot" /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-medium text-zinc-500">Type</label>
                    <div className="flex gap-1 mt-0.5">
                      <button onClick={() => setFormType("photo")} className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 ${formType === "photo" ? "border-pink-500 bg-pink-50 text-pink-600" : "border-zinc-200 dark:border-zinc-700"}`}><Image className="w-3.5 h-3.5 inline mr-1" />Photo</button>
                      <button onClick={() => setFormType("video")} className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 ${formType === "video" ? "border-pink-500 bg-pink-50 text-pink-600" : "border-zinc-200 dark:border-zinc-700"}`}><Video className="w-3.5 h-3.5 inline mr-1" />Video</button>
                    </div>
                  </div>
                  <div className="flex-1"><label className="text-xs font-medium text-zinc-500">Price ($)</label><input type="number" step="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border mt-0.5 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50" placeholder="4.99" /></div>
                </div>
                <div className="flex items-center justify-between"><span className="text-sm">{formPublished ? <span className="text-green-600 flex items-center gap-1"><Eye className="w-4 h-4" /> Published</span> : <span className="text-yellow-600 flex items-center gap-1"><EyeOff className="w-4 h-4" /> Draft</span>}</span><button onClick={() => setFormPublished(!formPublished)} className={`w-11 h-6 rounded-full transition-colors ${formPublished ? "bg-green-500" : "bg-zinc-300"}`}><div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${formPublished ? "translate-x-[22px]" : "translate-x-0.5"}`} /></button></div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-full text-sm border hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
                  <button onClick={saveAlbum} disabled={formSaving || !formTitle.trim()} className="flex-1 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 disabled:opacity-50 flex items-center justify-center gap-2">{formSaving && <Loader2 className="w-4 h-4 animate-spin" />}{editId ? "Save" : "Create"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {uploadAlbumId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Add Photos</h2><button onClick={() => setUploadAlbumId(null)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button></div>
              {uploadResult ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-xl font-bold">{uploadResult.uploaded} uploaded</p>
                  {uploadResult.failed > 0 && <p className="text-red-500 text-sm">{uploadResult.failed} failed</p>}
                  <button onClick={() => { setUploadAlbumId(null); loadAlbums(); }} className="mt-4 px-6 py-2 rounded-full bg-pink-500 text-white text-sm font-medium">Done</button>
                </div>
              ) : (
                <>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFiles} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-pink-400 transition-colors text-center mb-4">
                    <Upload className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                    <p className="text-sm text-zinc-500">Click to select files</p>
                    <p className="text-xs text-zinc-400 mt-1">Photos and videos supported</p>
                  </button>
                  {uploadFiles.length > 0 && (
                    <>
                      <div className="max-h-48 overflow-y-auto border rounded-xl divide-y dark:divide-zinc-700 mb-4">
                        {uploadFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span className="truncate text-zinc-700 dark:text-zinc-300">{i + 1}. {f.name}</span>
                            <button onClick={() => setUploadFiles(p => p.filter((_, j) => j !== i))} className="p-1 text-zinc-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                      {uploadUploading && <div className="mb-4"><div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full"><div className="h-full bg-pink-500 transition-all" style={{ width: `${uploadProgress}%` }} /></div><p className="text-xs text-zinc-400 text-center mt-1">Uploading...</p></div>}
                      <button onClick={startUpload} disabled={uploadUploading} className="w-full py-3 rounded-full font-medium text-sm text-white bg-gradient-to-r from-pink-500 to-rose-500 disabled:opacity-50 flex items-center justify-center gap-2">
                        {uploadUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{uploadUploading ? "Uploading..." : `Upload ${uploadFiles.length} Files`}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Album Grid */}
        {albums.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
            <h2 className="text-lg font-semibold mb-2">No albums yet</h2>
            <p className="text-zinc-400 text-sm mb-6">Create an album, set a price, then upload photos</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500"><Plus className="w-4 h-4" /> Create First Album</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albums.map(a => (
              <div key={a.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all group">
                <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                  {a.cover_url ? (
                    <img src={a.cover_url} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-300"><FolderOpen className="w-12 h-12" /></div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur">{a.type}</span>
                    {a.price ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/80 text-white backdrop-blur">${a.price}</span> : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/80 text-white backdrop-blur">Free</span>}
                    {!a.is_published && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/80 text-white backdrop-blur">Draft</span>}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(a)} className="p-2 rounded-lg bg-white text-zinc-700 hover:bg-pink-50 hover:text-pink-500" title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => openUpload(a.id)} className="p-2 rounded-lg bg-white text-zinc-700 hover:bg-blue-50 hover:text-blue-500" title="Add photos"><Upload className="w-4 h-4" /></button>
                    <button onClick={() => deleteAlbum(a.id)} className="p-2 rounded-lg bg-white text-zinc-700 hover:bg-red-50 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{a.title}</p>
                  {a.description && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{a.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
