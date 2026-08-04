"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Profile } from "@/types";

export default function AdminPurchasesPage() {
  return (
    <AuthGuard requireAdmin fallbackPath="/">
      <PurchasesContent />
    </AuthGuard>
  );
}

function PurchasesContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchases = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/verify-purchase");
      if (res.ok) {
        const d = await res.json();
        setPurchases(d.purchases || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await (await import("@/lib/supabase")).supabase.auth.getUser();
      if (user && !cancelled) {
        const { data: p } = await (await import("@/lib/supabase")).supabase.from("profiles").select("*").eq("id", user.id).single();
        if (!cancelled) setProfile(p as Profile);
      }
      if (!cancelled) await loadPurchases();
    })();
    const interval = setInterval(loadPurchases, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [loadPurchases]);

  const updateStatus = async (purchaseId: string, status: string) => {
    await fetch("/api/admin/verify-purchase", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId, status }),
    });
    await loadPurchases();
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 dark:bg-green-950 text-green-600",
    pending: "bg-yellow-100 dark:bg-yellow-950 text-yellow-600",
    expired: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
    cancelled: "bg-red-100 dark:bg-red-950 text-red-500",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar user={null} />
        <div className="flex-1 flex items-center justify-center">
          <svg className="w-8 h-8 animate-spin text-pink-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  const pendingCount = purchases.filter((p: any) => p.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin } : null} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="w-3 h-3" /> Admin
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Purchase Verification</h1>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-600 text-xs font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-sm mb-8">Verify crypto payments and approve to unlock content</p>

        {purchases.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border">
            <Clock className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <p className="text-zinc-500">No purchases yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((p: any) => (
              <div key={p.id} className="bg-white dark:bg-zinc-900 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{p.content_title || "Content Purchase"}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status] || ""}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 space-y-0.5">
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">User: {p.user_email || "Unknown"}</p>
                      <p>Crypto: {p.crypto_type || "N/A"} &middot; ${p.amount || "N/A"}</p>
                      {p.tx_hash && <p className="font-mono truncate text-[11px]">TX: {p.tx_hash}</p>}
                      {p.note && <p className="text-pink-500 dark:text-pink-400 font-medium mt-1 text-xs">Note: &ldquo;{p.note}&rdquo;</p>}
                      <p>{new Date(p.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {p.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateStatus(p.id, "active")}
                        className="p-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 hover:bg-green-100 transition-colors" title="Approve">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => updateStatus(p.id, "cancelled")}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 hover:bg-red-100 transition-colors" title="Reject">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
