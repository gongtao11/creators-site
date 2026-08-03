"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import type { Profile, Purchase } from "@/types";

export default function AdminPurchasesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchases = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/verify-purchase");
      if (res.ok) {
        const d = await res.json();
        setPurchases(d.purchases || []);
      }
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!(p as Profile)?.is_admin) { window.location.href = "/"; return; }
      setProfile(p as Profile);
      await loadPurchases();
    }
    load();
  }, [loadPurchases]);

  const updateStatus = async (purchaseId: string, status: string) => {
    await fetch("/api/admin/verify-purchase", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId, status }),
    });
    await loadPurchases();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 dark:bg-green-950 text-green-600",
    pending: "bg-yellow-100 dark:bg-yellow-950 text-yellow-600",
    expired: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
    cancelled: "bg-red-100 dark:bg-red-950 text-red-500",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={profile ? { id: profile.id, username: profile.username, isAdmin: profile.is_admin } : null} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
          <ArrowLeft className="w-3 h-3" /> Admin
        </Link>

        <h1 className="text-2xl font-bold mb-2">Purchase Verification</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
          Verify crypto payments and approve purchases
        </p>

        {purchases.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Clock className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <p className="text-zinc-500">No purchases yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((p: any) => (
              <div
                key={p.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {p.content_title || "Content Purchase"}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status] || ""}`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-500 space-y-0.5">
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">User: {p.user_email || "Unknown"}</p>
                      <p>Crypto: {p.crypto_type || "N/A"} &middot; ${p.amount || "N/A"}</p>
                      {p.tx_hash && (
                        <p className="font-mono truncate">
                          TX: {p.tx_hash}
                        </p>
                      )}
                      <p>Date: {new Date(p.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {p.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateStatus(p.id, "active")}
                        className="p-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 hover:bg-green-100 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, "cancelled")}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 hover:bg-red-100 transition-colors"
                        title="Reject"
                      >
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
