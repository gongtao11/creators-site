"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import {
  ArrowLeft,
  Upload,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { Profile, ScriptEntry } from "@/types";

export default function AdminScriptPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<ScriptEntry[]>([]);
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

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

      // 鍔犺浇璇濇湳
      try {
        const res = await fetch("/api/script");
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
        }
      } catch (error) {
        console.error("Failed to load script:", error);
      }

      // 鍔犺浇鍘熷 CSV 鏂囨湰鐢ㄤ簬缂栬緫
      try {
        const res = await fetch("/api/script");
        if (res.ok) {
          // 浠?entries 閲嶅缓 CSV
          const data = await res.json();
          const entries = data.entries || [];
          const csv = [
            "keywords,response,category",
            ...entries.map(
              (e: ScriptEntry) =>
                `"${e.keywords.join(",")}","${e.response.replace(/"/g, '""')}","${e.category}"`
            ),
          ].join("\n");
          setCsvText(csv);
        }
      } catch (error) {
        console.error("Failed to build CSV:", error);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/script", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: csvText }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus("success");
        setStatusMsg(`Saved! ${data.count} entries loaded.`);

        // 鍒锋柊 entries
        const refreshRes = await fetch("/api/script");
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setEntries(refreshData.entries || []);
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
    } catch (error) {
      setStatus("error");
      setStatusMsg(
        error instanceof Error ? error.message : "Failed to save"
      );
    } finally {
      setSaving(false);
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

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

  return (
    <>
      <Navbar
        user={
          profile
            ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin }
            : null
        }
      />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-2"
            >
              <ArrowLeft className="w-3 h-3" /> Admin
            </Link>
            <h1 className="text-2xl font-bold">Script Manager</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage AI auto-reply scripts. Upload CSV or edit directly.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "editor"
                ? "bg-white dark:bg-zinc-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            CSV Editor
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "preview"
                ? "bg-white dark:bg-zinc-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Preview ({entries.length} entries)
          </button>
        </div>

        {/* Status message */}
        {status !== "idle" && (
          <div
            className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
              status === "success"
                ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
                : "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"
            }`}
          >
            {status === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {statusMsg}
          </div>
        )}

        {activeTab === "editor" ? (
          <>
            {/* CSV Editor */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none resize-none"
                placeholder="keywords,response,category
&quot;hi,hello,hey&quot;,&quot;Hey there! 馃挄&quot;,&quot;greeting&quot;"
                spellCheck={false}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Upload CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* CSV Format Guide */}
            <details className="mt-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
              <summary className="text-sm font-medium cursor-pointer text-zinc-600 dark:text-zinc-400">
                CSV Format Guide
              </summary>
              <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 space-y-2">
                <p>
                  <strong>Format:</strong> <code>keywords,response,category</code>
                </p>
                <p>
                  <strong>keywords:</strong> Comma-separated trigger words (case-insensitive).
                  Use <code>"quotes"</code> if keywords contain commas.
                </p>
                <p>
                  <strong>response:</strong> The exact reply text. Always wrap in quotes.
                </p>
                <p>
                  <strong>category:</strong> For organization (greeting, pricing, etc.)
                </p>
                <p>
                  <strong>Special row:</strong> A row with keyword <code>default</code> is
                  the fallback when no other keywords match.
                </p>
                <p className="text-xs mt-2 text-pink-500">
                  馃挕 Tip: Edit in Excel, then export as CSV and upload here.
                </p>
              </div>
            </details>
          </>
        ) : (
          /* Preview Tab */
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
            {entries.map((entry, i) => (
              <div key={i} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex flex-wrap gap-1.5">
                    {entry.keywords.map((kw) => (
                      <span
                        key={kw}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          kw === "default"
                            ? "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400"
                            : "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full shrink-0 ml-2">
                    {entry.category}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">
                  {entry.response}
                </p>
              </div>
            ))}

            {entries.length === 0 && (
              <div className="p-8 text-center text-zinc-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No entries loaded. Upload a CSV file first.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
