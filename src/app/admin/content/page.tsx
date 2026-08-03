"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import {
  ArrowLeft, Loader2, Image, Video, Edit, Trash2, Upload,
  X, Eye, EyeOff, CheckCircle,
} from "lucide-react";
import type { Profile, Content } from "@/types";

export default function AdminContentPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showBatch, setShowBatch] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchTitle, setBatchTitle] = useState("Photo");
  const [batchPrice, setBatchPrice] = useState("");
  const [batchType, setBatchType] = useState<"photo" | "video">("photo");
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResult, setBatchResult] = useState<{ uploaded: number; failed: number } | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPublished, setEditPublished] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data: pd } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!(pd as Profile)?.is_admin) { window.location.href = "/"; return; }
    setProfile(pd as Profile);
    try {
      const res = await fetch("/api/admin/content");
      if (res.ok) {
        const data = await res.json();
        setContents((data.contents as Content[]) || []);
      }
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBatchFiles(files);
    setShowBatch(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setBatchFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const startBatchUpload = async () => {
    if (batchFiles.length === 0) return;
    setBatchUploading(true);
    setBatchProgress(0);
    setBatchResult(null);

    const formData = new FormData();
    batchFiles.forEach((f) => formData.append("files", f));
    formData.append("title_prefix", batchTitle);
    formData.append("type", batchType);
    if (batchPrice) formData.append("price", batchPrice);

    const interval = setInterval(() => setBatchProgress((p) => Math.min(p + 8, 90)), 400);

    try {
      const res = await fetch("/api/admin/batch-upload", { method: "POST", body: formData });
      const data = await res.json();
      clearInterval(interval);
      setBatchProgress(100);
      if (data.success) setBatchResult({ uploaded: data.uploaded, failed: data.failed });
      await loadData();
    } catch {
      clearInterval(interval);
      setBatchResult({ uploaded: 0, failed: batchFiles.length });
    }
    setBatchUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/admin/content?id=${id}`, { method: "DELETE" });
    setContents((prev) => prev.filter((c) => c.id !== id));
  };

  const openEdit = (c: Content) => {
    setEditId(c.id); setEditTitle(c.title);
    setEditPrice(c.price != null ? String(c.price) : "");
    setEditPublished(c.is_published); setShowEdit(true);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, title: editTitle, price: editPrice ? parseFloat(editPrice) : null, is_published: editPublished }),
    });
    setEditSaving(false); setShowEdit(false); await loadData();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin } : null} />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-2"><ArrowLeft className="w-3 h-3" /> Admin</Link>
            <h1 className="text-2xl font-bold">Content Manager</h1>
            <p className="text-sm text-zinc-400">{contents.length} items</p>
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFilesSelected} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg transition-all">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>

        {/* Batch Modal */}
        {showBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Upload {batchFiles.length} files</h2>
                  <button onClick={() => { setShowBatch(false); setBatchFiles([]); setBatchResult(null); }} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
                </div>

                {batchResult ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-xl font-bold">{batchResult.uploaded} uploaded</p>
                    {batchResult.failed > 0 && <p className="text-red-500 text-sm">{batchResult.failed} failed</p>}
                    <button onClick={() => { setShowBatch(false); setBatchFiles([]); setBatchResult(null); }} className="mt-4 px-6 py-2 rounded-full bg-pink-500 text-white text-sm font-medium">Done</button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="text-xs font-medium text-zinc-500">Title prefix</label>
                        <input value={batchTitle} onChange={(e) => setBatchTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm mt-0.5 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                          placeholder="Files will be numbered: Photo #1, Photo #2..." />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-zinc-500">Type</label>
                          <div className="flex gap-1 mt-0.5">
                            <button onClick={() => setBatchType("photo")} className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 ${batchType === "photo" ? "border-pink-500 bg-pink-50 text-pink-600" : "border-zinc-200 dark:border-zinc-700"}`}><Image className="w-3.5 h-3.5 inline mr-1" />Photo</button>
                            <button onClick={() => setBatchType("video")} className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 ${batchType === "video" ? "border-pink-500 bg-pink-50 text-pink-600" : "border-zinc-200 dark:border-zinc-700"}`}><Video className="w-3.5 h-3.5 inline mr-1" />Video</button>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-zinc-500">Price ($)</label>
                          <input type="number" step="0.01" min="0" value={batchPrice} onChange={(e) => setBatchPrice(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm mt-0.5 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                            placeholder="4.99 (empty=free)" />
                        </div>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border rounded-xl divide-y dark:divide-zinc-700 mb-4">
                      {batchFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="truncate flex-1 text-zinc-700 dark:text-zinc-300">{i + 1}. {f.name}</span>
                          <button onClick={() => removeFile(i)} className="p-1 text-zinc-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>

                    {batchUploading && (
                      <div className="mb-4">
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500 transition-all" style={{ width: `${batchProgress}%` }} />
                        </div>
                        <p className="text-center text-xs text-zinc-400 mt-1">Uploading {batchFiles.length} files...</p>
                      </div>
                    )}

                    <button onClick={startBatchUpload} disabled={batchUploading || batchFiles.length === 0}
                      className="w-full py-3 rounded-full font-medium text-sm text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                      {batchUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {batchUploading ? "Uploading..." : `Upload ${batchFiles.length} Files`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Edit Content</h2>
                <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button></div>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Title</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-pink-500/50" /></div>
                <div><label className="text-sm font-medium">Price ($)</label>
                  <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-pink-500/50" /></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{editPublished ? <span className="text-green-600 flex items-center gap-1"><Eye className="w-4 h-4" /> Published</span> : <span className="text-yellow-600 flex items-center gap-1"><EyeOff className="w-4 h-4" /> Draft</span>}</span>
                  <button onClick={() => setEditPublished(!editPublished)} className={`w-11 h-6 rounded-full transition-colors ${editPublished ? "bg-green-500" : "bg-zinc-300"}`}><div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${editPublished ? "translate-x-[22px]" : "translate-x-0.5"}`} /></button>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-full text-sm border hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
                  <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 disabled:opacity-50 flex items-center justify-center gap-2">{editSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        {contents.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border">
            <Image className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
            <h2 className="text-lg font-semibold mb-2">No content yet</h2>
            <p className="text-zinc-400 text-sm mb-6">Click &quot;Upload&quot; to add photos and videos</p>
            <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500"><Upload className="w-4 h-4" /> Upload Your Content</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {contents.map((c) => (
              <div key={c.id} className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all">
                <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                  {c.preview_url ? (
                    <img src={c.preview_url} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-300">
                      {c.type === "video" ? <Video className="w-8 h-8" /> : <Image className="w-8 h-8" />}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur">{c.type}</span>
                    {c.price ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/80 text-white backdrop-blur">${c.price}</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/80 text-white backdrop-blur">Free</span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-lg bg-white text-zinc-700 hover:bg-pink-50 hover:text-pink-500" title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg bg-white text-zinc-700 hover:bg-red-50 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-2.5"><p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{c.title}</p></div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
