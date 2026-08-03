"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Image,
  Video,
  Edit,
  Trash2,
  Upload,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Profile, Content } from "@/types";

export default function AdminContentPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  // 涓婁紶琛ㄥ崟
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [price, setPrice] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewPreview, setPreviewPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!(profileData as Profile)?.is_admin) {
      window.location.href = "/";
      return;
    }

    setProfile(profileData as Profile);

    // 閫氳繃 API 鍔犺浇锛堢粫杩?RLS锛?    try {
      const res = await fetch("/api/admin/content");
      if (res.ok) {
        const data = await res.json();
        setContents((data.contents as Content[]) || []);
      }
    } catch (e) {
      console.error("Load content failed:", e);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 閲嶇疆琛ㄥ崟
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("photo");
    setPrice("");
    setIsPublished(true);
    setPreviewFile(null);
    setPreviewPreview("");
    setEditingId(null);
    setError("");
  };

  // 鎵撳紑鏂板缓琛ㄥ崟
  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  // 鎵撳紑缂栬緫琛ㄥ崟
  const openEdit = (c: Content) => {
    setTitle(c.title);
    setDescription(c.description || "");
    setType(c.type);
    setPrice(c.price != null ? String(c.price) : "");
    setIsPublished(c.is_published);
    setPreviewPreview(c.preview_url || "");
    setEditingId(c.id);
    setError("");
    setShowForm(true);
  };

  // 澶勭悊鏂囦欢閫夋嫨
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewFile(file);
      setPreviewPreview(URL.createObjectURL(file));
    }
  };

  // 涓婁紶鏂囦欢锛堣蛋鍚庣 API 缁曡繃 RLS锛?  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Upload failed");
    return result.url;
  };

  // 鎻愪氦琛ㄥ崟
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      let previewUrl = previewPreview;

      // 涓婁紶鏂版枃浠?      if (previewFile) {
        previewUrl = await uploadFile(previewFile);
      }

      const contentData = {
        title,
        description,
        type,
        preview_url: previewUrl || null,
        full_url: previewUrl || null,
        price: price ? parseFloat(price) : null,
        is_published: isPublished,
      };

      // 閫氳繃 API 鎿嶄綔锛堢粫杩?RLS锛?      if (editingId) {
        const res = await fetch("/api/admin/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...contentData }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Update failed");
      } else {
        const res = await fetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contentData),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Create failed");
      }

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // 鍒犻櫎鍐呭
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;

    const res = await fetch(`/api/admin/content?id=${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setContents((prev) => prev.filter((c) => c.id !== id));
    }
  };

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
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-2"
            >
              <ArrowLeft className="w-3 h-3" /> Admin
            </Link>
            <h1 className="text-2xl font-bold">Content Manager</h1>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        {/* 涓婁紶琛ㄥ崟寮圭獥 */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {editingId ? "Edit Content" : "Add New Content"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950 text-red-600 text-sm p-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 绫诲瀷閫夋嫨 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setType("photo")}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        type === "photo"
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950 text-pink-600"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                      }`}
                    >
                      <Image className="w-4 h-4 inline mr-1" />
                      Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("video")}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        type === "video"
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950 text-pink-600"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                      }`}
                    >
                      <Video className="w-4 h-4 inline mr-1" />
                      Video
                    </button>
                  </div>
                </div>

                {/* 鏍囬 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    placeholder="Summer Vibes 馃寠"
                  />
                </div>

                {/* 鎻忚堪 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                    placeholder="A short description..."
                  />
                </div>

                {/* 浠锋牸 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Price ($) <span className="text-zinc-400 font-normal">鈥?leave empty for free</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    placeholder="4.99"
                  />
                </div>

                {/* 棰勮鍥句笂浼?*/}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Preview Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100"
                  />
                  {previewPreview && (
                    <div className="mt-2 relative inline-block">
                      <img
                        src={previewPreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-xl border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewFile(null);
                          setPreviewPreview("");
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 鍙戝竷鐘舵€?*/}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {isPublished ? (
                      <span className="flex items-center gap-1.5 text-green-600">
                        <Eye className="w-4 h-4" /> Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-yellow-600">
                        <EyeOff className="w-4 h-4" /> Draft
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPublished(!isPublished)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      isPublished ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        isPublished ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* 鎻愪氦 */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="flex-1 py-2.5 rounded-full text-sm font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingId ? "Save Changes" : "Create Content"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 鍐呭鍒楄〃 */}
        {contents.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Image className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
            <h2 className="text-lg font-semibold mb-2">No content yet</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
              Start uploading your exclusive photos and videos
            </p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm text-white bg-gradient-to-r from-pink-500 to-rose-500"
            >
              <Plus className="w-4 h-4" />
              Add First Content
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contents.map((content) => (
              <div
                key={content.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4"
              >
                {/* 缂╃暐鍥?*/}
                <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                  {content.preview_url ? (
                    <img
                      src={content.preview_url}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {content.type === "video" ? (
                        <Video className="w-6 h-6 text-zinc-400" />
                      ) : (
                        <Image className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{content.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        content.is_published
                          ? "bg-green-100 dark:bg-green-950 text-green-600"
                          : "bg-yellow-100 dark:bg-yellow-950 text-yellow-600"
                      }`}
                    >
                      {content.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 capitalize">
                    {content.type} {content.price ? `鈥?$${content.price}` : "鈥?Free"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(content)}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-zinc-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
